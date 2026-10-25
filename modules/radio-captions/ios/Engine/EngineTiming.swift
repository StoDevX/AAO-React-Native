/// Maps each decoder run's own clock onto the one timeline the transcriber lives on.
///
/// Every decoder counts its audio from 0, but the transcriber outlives the connection and
/// rejects times that overlap or precede audio it has had. A run therefore starts where the
/// last buffer of the run before it ended.
struct EngineTimeline {
	private var base = 0.0
	private var runEnd = 0.0

	/// Starts a run at the end of the previous one's audio.
	mutating func beginRun() {
		base += runEnd
		runEnd = 0
	}

	/// Notes that the decoder produced a buffer, so the next run knows where this one ended.
	mutating func delivered(startSeconds: Double, duration: Double) {
		runEnd = max(runEnd, startSeconds + duration)
	}

	/// The transcriber's time for a time on the current run's clock.
	func time(forRunSeconds seconds: Double) -> Double { base + seconds }
}

/// How long to wait before the next try at a lost stream: `first`, doubling to `longest`.
struct Backoff {
	private let first: Duration
	private let longest: Duration
	private var upcoming: Duration

	init(first: Duration, longest: Duration) {
		self.first = first
		self.longest = longest
		upcoming = first
	}

	mutating func next() -> Duration {
		defer { upcoming = min(upcoming * 2, longest) }
		return upcoming
	}

	/// Starts again at `first`, as after a connection that delivered audio.
	mutating func reset() { upcoming = first }
}

/// Tells that a connection has gone quiet. A progressive stream can stop sending without
/// failing, so the lack of audio is the only sign that it is lost.
struct StallDetector {
	private let timeout: Duration
	private var lastHeard: ContinuousClock.Instant

	init(timeout: Duration, since start: ContinuousClock.Instant) {
		self.timeout = timeout
		lastHeard = start
	}

	mutating func heardAudio(at instant: ContinuousClock.Instant) { lastHeard = instant }

	func isStalled(at instant: ContinuousClock.Instant) -> Bool { instant - lastHeard >= timeout }
}
