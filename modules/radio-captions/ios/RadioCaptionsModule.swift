import CoreGraphics
import ExpoModulesCore
import MediaAccessibility
import os

public class RadioCaptionsModule: Module {
	/// The running engine and what forwards its events; replaced by each `start`.
	private struct Session {
		var engine: RadioCaptionEngine
		var forwarder: CaptionForwarder
	}
	private let session = OSAllocatedUnfairLock<Session?>(initialState: nil)

	public func definition() -> ModuleDefinition {
		Name("RadioCaptions")
		Events("onCaption", "onState")

		AsyncFunction("start") { (url: String, locale: String) in
			guard let streamURL = URL(string: url) else {
				throw Exception(name: "InvalidURL", description: "The stream address is not a valid URL: \(url)")
			}
			self.stopEngine()
			let engine = RadioCaptionEngine(url: streamURL, locale: Locale(identifier: locale))
			let forwarder = CaptionForwarder { [weak self] event in self?.send(event) }
			forwarder.forward(engine.events())
			self.session.withLock { $0 = Session(engine: engine, forwarder: forwarder) }
			await engine.start()
		}

		Function("stop") { self.stopEngine() }

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

		OnDestroy { self.stopEngine() }
	}

	private func send(_ event: EngineEvent) {
		switch event {
		case .caption(let update):
			sendEvent("onCaption", ["kind": update.isFinal ? "final" : "volatile", "text": update.text])
		case .state(let state):
			sendEvent("onState", state.payload)
		}
	}

	/// Ends the running engine, if any. Safe to call at any time and from any thread.
	private func stopEngine() {
		let ended = session.withLock { session in
			defer { session = nil }
			return session
		}
		ended?.engine.stop()
		ended?.forwarder.cancel()
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

/// Reads an engine's events and hands them on through a `CaptionEventCoalescer`, sending a
/// held-back volatile caption once its interval has passed even if nothing newer arrives.
private final class CaptionForwarder: @unchecked Sendable {
	private struct State {
		var coalescer = CaptionEventCoalescer(now: { ProcessInfo.processInfo.systemUptime })
		var reading: Task<Void, Never>?
		var flushing: Task<Void, Never>?
		var cancelled = false
	}
	private let state = OSAllocatedUnfairLock(initialState: State())
	private let send: @Sendable (EngineEvent) -> Void

	init(send: @escaping @Sendable (EngineEvent) -> Void) {
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
		let (ready, wait) = state.withLock { state in
			(state.coalescer.accept(event), state.coalescer.dueIn)
		}
		ready.forEach(send)
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
					if Task.isCancelled { break }
					// Ending and clearing `flushing` happen under one lock, so a caption held
					// back just after this one's last check always finds a flusher to wake.
					let (due, next) = self.state.withLock { state in
						let due = state.coalescer.takeDue()
						let next = state.coalescer.dueIn
						if next == nil { state.flushing = nil }
						return (due, next)
					}
					if let due { send(due) }
					guard let next else { return }
					wait = next
				}
			}
		}
	}
}
