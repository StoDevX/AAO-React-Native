import AVFoundation
import os

public enum EngineState: Sendable, Equatable {
	case downloading, reconnecting, captioning, music
	case unavailable(String)
}

public enum EngineEvent: Sendable, Equatable {
	case caption(CaptionUpdate)
	case state(EngineState)
}

/// Captions the speech in a radio stream and skips its music, on the device.
///
/// The stream is decoded and classified as it arrives. While the classifier hears music the
/// audio waits in a short pre-roll buffer; once it hears speech, the pre-roll and everything
/// after go to the transcriber. A lost stream is read again with a growing delay.
public final class RadioCaptionEngine {
	private let url: URL
	private let transcriber: CaptionTranscriber
	private let stallTimeout: Duration
	/// Lets a test replace what `start()` listens to for captions with a stream built from it.
	private let captionUpdates: (AsyncThrowingStream<CaptionUpdate, Error>) -> AsyncThrowingStream<CaptionUpdate, Error>
	private var backoff: Backoff
	private var timeline = EngineTimeline()

	/// What `stop()` and the engine's tasks share.
	private struct Shared {
		var continuation: AsyncStream<EngineEvent>.Continuation?
		var stream: AsyncStream<EngineEvent>?
		var tasks: [Task<Void, Never>] = []
		var decoder: StreamAudioDecoder?
		var state: EngineState?
		var stopped = false
		/// `start()` has been called; a second call does nothing.
		var started = false
		/// The transcriber is running, so whoever ends the engine must finish it, once.
		var transcriberStarted = false
		/// Captions have failed for good: `.unavailable` is the last state the engine sends.
		var failed = false
	}
	private let shared = OSAllocatedUnfairLock(initialState: Shared())

	/// How much audio is kept from before the gate opens. The classifier judges 3 s windows
	/// 1.5 s apart, so it calls speech about 5 s after it starts; the rest is margin.
	private static let preRollSeconds = 7.0

	/// The longest piece of audio the engine gates and feeds at once.
	private static let sliceSeconds = 0.5

	public convenience init(url: URL, locale: Locale) {
		self.init(
			url: url, locale: locale, stallTimeout: .seconds(10),
			backoff: Backoff(first: .seconds(2), longest: .seconds(30)))
	}

	init(
		url: URL, locale: Locale, stallTimeout: Duration, backoff: Backoff,
		captionUpdates: @escaping (AsyncThrowingStream<CaptionUpdate, Error>) -> AsyncThrowingStream<CaptionUpdate, Error> = { $0 }
	) {
		self.url = url
		self.stallTimeout = stallTimeout
		self.backoff = backoff
		self.captionUpdates = captionUpdates
		transcriber = CaptionTranscriber(locale: locale)
	}

	/// The engine's events. There is one stream and one consumer: every call returns the same
	/// stream, so two loops over it would split the events between them. After `stop()` the
	/// stream is already finished.
	public func events() -> AsyncStream<EngineEvent> {
		shared.withLock { shared in
			if shared.stopped { return AsyncStream { $0.finish() } }
			if let stream = shared.stream { return stream }
			let made = AsyncStream<EngineEvent> { shared.continuation = $0 }
			shared.stream = made
			return made
		}
	}

	/// Prepares the speech model, then reads the stream until `stop()`. Returns once reading
	/// has begun. Does nothing if the engine has stopped or is already running.
	public func start() async {
		let begin = shared.withLock { shared in
			if shared.stopped || shared.started { return false }
			shared.started = true
			return true
		}
		guard begin else { return }
		_ = events()
		emit(.state(.downloading))
		let updates: AsyncThrowingStream<CaptionUpdate, Error>
		do {
			if isStopped { return }
			try await transcriber.prepare()
			if isStopped { return }
			updates = captionUpdates(try await transcriber.start())
		} catch let error as CaptionError {
			emit(.state(.unavailable(Self.message(for: error))))
			return
		} catch {
			emit(.state(.unavailable("Captions could not start.")))
			return
		}
		// Whoever sees the engine stopped finishes the transcriber: `stop()` if it ran after this,
		// this method if it ran before.
		let stoppedWhileStarting = shared.withLock { shared in
			if !shared.stopped { shared.transcriberStarted = true }
			return shared.stopped
		}
		if stoppedWhileStarting {
			await transcriber.finish()
			return
		}
		register(Task { [weak self] in
			do { for try await update in updates { self?.emit(.caption(update)) } }
			catch { self?.fail(((error as? CaptionError).map(Self.message(for:))) ?? "Captions stopped.") }
		})
		register(Task { [weak self] in await self?.listen() })
	}

	/// Ends the engine and its event stream. Safe to call more than once, and while `start()`
	/// is still preparing: nothing is emitted afterwards.
	public func stop() {
		let (tasks, decoder, continuation, finishTranscriber) = shared.withLock { shared in
			shared.stopped = true
			defer {
				shared.tasks = []
				shared.decoder = nil
				shared.continuation = nil
				shared.transcriberStarted = false
			}
			return (shared.tasks, shared.decoder, shared.continuation, shared.transcriberStarted)
		}
		tasks.forEach { $0.cancel() }
		decoder?.stop()
		continuation?.finish()
		if finishTranscriber { Task { [transcriber] in await transcriber.finish() } }
	}

	/// Ends reading for good and makes `.unavailable(message)` the engine's last state. The event
	/// stream stays open until `stop()`, so a listener still sees why.
	private func fail(_ message: String) {
		let (tasks, decoder, finishTranscriber) = shared.withLock { shared -> ([Task<Void, Never>], StreamAudioDecoder?, Bool) in
			guard !shared.stopped, !shared.failed else { return ([], nil, false) }
			shared.failed = true
			shared.state = .unavailable(message)
			shared.continuation?.yield(.state(.unavailable(message)))
			defer {
				shared.tasks = []
				shared.decoder = nil
				shared.transcriberStarted = false
			}
			return (shared.tasks, shared.decoder, shared.transcriberStarted)
		}
		tasks.forEach { $0.cancel() }
		decoder?.stop()
		if finishTranscriber { Task { [transcriber] in await transcriber.finish() } }
	}

	private var isStopped: Bool { shared.withLock { $0.stopped } }
	private var isFailed: Bool { shared.withLock { $0.failed } }

	/// Keeps a task to cancel at `stop()`, or cancels it at once if the engine has stopped.
	private func register(_ task: Task<Void, Never>) {
		let stopped = shared.withLock { shared in
			if !shared.stopped { shared.tasks.append(task) }
			return shared.stopped
		}
		if stopped { task.cancel() }
	}

	/// Reads the stream, again after each loss, until stopped.
	private func listen() async {
		while !Task.isCancelled {
			let sawAudio = await readOnce()
			if Task.isCancelled { return }
			emit(.state(.reconnecting))
			if sawAudio { backoff.reset() }
			try? await Task.sleep(for: backoff.next())
		}
	}

	/// One connection's worth of audio. Returns whether any arrived.
	///
	/// The decoder's audio is unbounded and bursts at connect, about 24 times real time for
	/// the first half minute, so everything in this loop is cheap: classify, gate, hand to
	/// the transcriber, and keep in memory. Slow work here would let the stream's buffers
	/// pile up behind it.
	private func readOnce() async -> Bool {
		let decoder = StreamAudioDecoder(url: url)
		let stopped = shared.withLock { shared in
			if !shared.stopped { shared.decoder = decoder }
			return shared.stopped
		}
		if stopped { return false }
		timeline.beginRun()

		let detector = OSAllocatedUnfairLock(initialState: StallDetector(timeout: stallTimeout, since: .now))
		let watchdog = Task { [stallTimeout] in
			while !Task.isCancelled {
				try? await Task.sleep(for: stallTimeout / 4)
				if detector.withLock({ $0.isStalled(at: .now) }) {
					decoder.stop()
					return
				}
			}
		}
		defer { watchdog.cancel() }

		var gate = MusicGate()
		var preRoll = PreRollBuffer(maxSeconds: Self.preRollSeconds)
		var classifier: MusicClassifier?
		var sawAudio = false
		var framesDelivered: AVAudioFramePosition = 0
		let scores = ScoreQueue()
		// The gate sees each window's scores once, as it was tuned on windows.
		func applyScores() {
			for score in scores.drain() {
				let before = gate.state
				guard gate.observe(speech: score.speech, music: score.music) != before else { continue }
				if gate.state == .speech {
					emit(.state(.captioning))
					for chunk in preRoll.drain() {
						transcriber.feed(chunk.buffer, startSeconds: timeline.time(forRunSeconds: chunk.startSeconds))
					}
				} else {
					emit(.state(.music))
				}
			}
		}

		func handle(_ buffer: AVAudioPCMBuffer, startSeconds: Double) {
			let rate = buffer.format.sampleRate
			timeline.delivered(startSeconds: startSeconds, duration: Double(buffer.frameLength) / rate)
			if !sawAudio {
				sawAudio = true
				emit(.state(.music))
				do {
					classifier = try MusicClassifier(format: buffer.format) { scores.add(speech: $0, music: $1) }
				} catch {
					fail("Captions could not start.")
					return
				}
			}
			classifier?.analyze(buffer, framePosition: framesDelivered)
			framesDelivered += AVAudioFramePosition(buffer.frameLength)

			applyScores()
			if gate.state == .speech {
				transcriber.feed(buffer, startSeconds: timeline.time(forRunSeconds: startSeconds))
			} else {
				preRoll.append(buffer, startSeconds: startSeconds)
			}
		}

		for await audio in decoder.start() {
			detector.withLock { $0.heardAudio(at: .now) }
			// The decoder's first reads are many seconds long; the gate and pre-roll work in pieces.
			let rate = audio.buffer.format.sampleRate
			var offset: AVAudioFramePosition = 0
			for piece in audio.buffer.slices(maxFrames: AVAudioFrameCount(rate * Self.sliceSeconds)) {
				if Task.isCancelled { break }
				handle(piece, startSeconds: audio.startSeconds + Double(offset) / rate)
				offset += AVAudioFramePosition(piece.frameLength)
			}
			if Task.isCancelled || isFailed { break }
		}
		// A stream that ends early still has windows the classifier has not reported.
		classifier?.finish()
		if !Task.isCancelled { applyScores() }
		decoder.stop()
		return sawAudio
	}

	/// Sends `event`, unless it repeats the state the engine is already in.
	private func emit(_ event: EngineEvent) {
		shared.withLock { shared in
			if case .state(let state) = event {
				guard !shared.failed, shared.state != state else { return }
				shared.state = state
			}
			shared.continuation?.yield(event)
		}
	}

	private static func message(for error: CaptionError) -> String {
		switch error {
		case .unsupportedLocale: "Captions are not available in this language."
		case .authorizationDenied: "Allow speech recognition in Settings to show captions."
		case .assetsUnavailable: "Captions need a one-time download. Connect to the internet and try again."
		case .insufficientResources: "Another app is using speech recognition. Try again in a moment."
		case .failed(let reason): reason
		}
	}
}

/// Classifier scores. The classifier reports them synchronously inside `analyze` and `finish`,
/// on the thread that called, so the loop reads what it just wrote; the lock keeps that true
/// should the classifier ever report from another thread.
private final class ScoreQueue: @unchecked Sendable {
	struct Score { let speech: Double; let music: Double }
	private let pending = OSAllocatedUnfairLock(initialState: [Score]())

	func add(speech: Double, music: Double) {
		pending.withLock { $0.append(Score(speech: speech, music: music)) }
	}

	func drain() -> [Score] {
		pending.withLock { pending in
			defer { pending = [] }
			return pending
		}
	}
}
