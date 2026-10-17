import CoreGraphics
import ExpoModulesCore
import MediaAccessibility
import os

public class RadioCaptionsModule: Module {
	/// The running engine and what forwards its events.
	fileprivate struct Session {
		var engine: RadioCaptionEngine
		var forwarder: CaptionForwarder
	}
	/// Which start is running, and which the JavaScript side has stopped. Every change is one
	/// critical section, so a start and a stop cannot interleave into an orphaned engine.
	private let ledger = OSAllocatedUnfairLock(initialState: CaptionSessionLedger<Session>())

	public func definition() -> ModuleDefinition {
		Name("RadioCaptions")
		Events("onCaption", "onState")

		// `startId` is the JavaScript side's count of starts; `stop` names the highest one it
		// has made, so a stop that arrives before this body runs still cancels it.
		AsyncFunction("start") { (url: String, locale: String, startId: Int) in
			guard let streamURL = StreamURL.parse(url) else {
				throw Exception(
					name: "InvalidURL",
					description: "The stream address must be an http or https URL with a host: \(url)")
			}
			guard self.ledger.withLock({ $0.mayStart(id: startId) }) else { return }
			let engine = RadioCaptionEngine(url: streamURL, locale: Locale(identifier: locale))
			let forwarder = CaptionForwarder(
				isCurrent: { [weak self] in self?.ledger.withLock { $0.isCurrent(id: startId) } ?? false },
				send: { [weak self] event in self?.send(event) })
			let (installed, previous) = self.ledger.withLock {
				$0.begin(id: startId, session: Session(engine: engine, forwarder: forwarder))
			}
			previous?.end()
			guard installed else { return }
			forwarder.forward(engine.events())
			await engine.start()
			// A stop that came while the model downloaded has already ended this session.
			if !self.ledger.withLock({ $0.isCurrent(id: startId) }) { Session(engine: engine, forwarder: forwarder).end() }
		}

		Function("stop") { (throughStartId: Int) in
			self.ledger.withLock { $0.stop(through: throughStartId) }?.end()
		}

		Function("captionStyle") { () -> [String: Any] in
			// The viewer's Settings → Accessibility → Subtitles & Captioning choices.
			[
				"foreground": Self.hex(
					MACaptionAppearanceCopyForegroundColor(.user, nil).takeRetainedValue(),
					opacity: MACaptionAppearanceGetForegroundOpacity(.user, nil)),
				"background": Self.hex(
					MACaptionAppearanceCopyBackgroundColor(.user, nil).takeRetainedValue(),
					opacity: MACaptionAppearanceGetBackgroundOpacity(.user, nil)),
				"fontFamily": NSNull(),
				"fontScale": Double(MACaptionAppearanceGetRelativeCharacterSize(.user, nil)),
			]
		}

		OnDestroy { self.ledger.withLock { $0.stopAll() }?.end() }
	}

	private func send(_ event: EngineEvent) {
		switch event {
		case .caption(let update):
			sendEvent("onCaption", ["kind": update.isFinal ? "final" : "volatile", "text": update.text])
		case .state(let state):
			sendEvent("onState", state.payload)
		}
	}

	/// A color as `#RRGGBBAA` in sRGB, scaled by the viewer's opacity setting, which iOS keeps
	/// apart from the color itself.
	static func hex(_ color: CGColor, opacity: CGFloat) -> String {
		let srgb = CGColorSpace(name: CGColorSpace.sRGB)
		let converted = srgb.flatMap { color.converted(to: $0, intent: .defaultIntent, options: nil) } ?? color
		let parts = converted.components ?? []
		// A gray color has two components, a color three; the alpha is the last.
		let rgb: [CGFloat] =
			parts.count >= 4 ? Array(parts[0..<3]) : parts.count >= 2 ? Array(repeating: parts[0], count: 3) : [0, 0, 0]
		let alpha = (parts.last ?? 1) * opacity
		let bytes = (rgb + [alpha]).map { UInt8((min(max($0, 0), 1) * 255).rounded()) }
		return "#" + bytes.map { String(format: "%02X", $0) }.joined()
	}
}

extension EngineState {
	/// The state as the JavaScript side receives it.
	var payload: [String: Any] {
		switch self {
		case .downloading: ["kind": "downloading"]
		case .reconnecting: ["kind": "reconnecting"]
		case .captioning: ["kind": "captioning"]
		case .music: ["kind": "music"]
		case .unavailable(let reason): ["kind": "unavailable", "reason": reason]
		}
	}
}

extension RadioCaptionsModule.Session {
	/// Stops the engine and the forwarding of what it said.
	func end() {
		engine.stop()
		forwarder.cancel()
	}
}

/// Reads an engine's events and hands them on through a `CaptionEventCoalescer`, sending a
/// held-back volatile caption once its interval has passed even if nothing newer arrives.
///
/// Taking an event from the coalescer and sending it happen in one critical section, so events
/// reach JavaScript in the order the coalescer produced them, and none is sent once the
/// forwarder is cancelled or its session is no longer the current one.
private final class CaptionForwarder: @unchecked Sendable {
	private struct State {
		var coalescer = CaptionEventCoalescer(now: { ProcessInfo.processInfo.systemUptime })
		var reading: Task<Void, Never>?
		var flushing: Task<Void, Never>?
		var cancelled = false
	}
	private let state = OSAllocatedUnfairLock(initialState: State())
	private let isCurrent: @Sendable () -> Bool
	private let send: @Sendable (EngineEvent) -> Void

	init(isCurrent: @escaping @Sendable () -> Bool, send: @escaping @Sendable (EngineEvent) -> Void) {
		self.isCurrent = isCurrent
		self.send = send
	}

	func forward(_ events: AsyncStream<EngineEvent>) {
		let reading = Task { [self] in
			for await event in events { handle(event) }
		}
		state.withLock { $0.reading = reading }
	}

	func cancel() {
		let tasks = state.withLock { state in
			state.cancelled = true
			return [state.reading, state.flushing]
		}
		tasks.forEach { $0?.cancel() }
	}

	private func handle(_ event: EngineEvent) {
		let wait: Double? = state.withLock { state in
			guard !state.cancelled, isCurrent() else { return nil }
			state.coalescer.accept(event).forEach(send)
			return state.coalescer.dueIn
		}
		if let wait { scheduleFlush(after: wait) }
	}

	/// Starts the task that sends the held-back caption, unless one is already waiting.
	private func scheduleFlush(after delay: Double) {
		state.withLock { held in
			guard held.flushing == nil, !held.cancelled else { return }
			held.flushing = Task { [self] in
				var wait = delay
				while !Task.isCancelled {
					try? await Task.sleep(for: .seconds(wait))
					// Ending and clearing `flushing` happen in the same critical section as
					// the send, so a caption held back just after this one's last check
					// always finds a flusher to wake.
					let next: Double? = self.state.withLock { state in
						if !state.cancelled, isCurrent(), let due = state.coalescer.takeDue() { send(due) }
						let next = state.cancelled ? nil : state.coalescer.dueIn
						if next == nil { state.flushing = nil }
						return next
					}
					guard let next else { return }
					wait = next
				}
				self.state.withLock { $0.flushing = nil }
			}
		}
	}
}
