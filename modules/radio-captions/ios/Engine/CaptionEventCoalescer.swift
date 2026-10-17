import Foundation

/// Thins the engine's events for the JavaScript bridge: the recognizer revises a volatile
/// caption dozens of times a second, and only the latest revision is worth sending.
///
/// At most one volatile caption passes per `interval`; one that arrives sooner waits as the
/// pending text, replaced by any newer one, until `takeDue()` releases it. A final caption
/// replaces whatever is pending, and a state event passes at once, so neither is delayed. A state
/// other than `.captioning` also drops the pending text, since it says the speech no longer
/// applies; `.captioning` leaves it be.
struct CaptionEventCoalescer {
	private let interval: Double
	private let now: () -> Double
	private var lastVolatileSent: Double?
	private var pending: EngineEvent?

	init(interval: Double = 0.1, now: @escaping () -> Double) {
		self.interval = interval
		self.now = now
	}

	/// The events to deliver now for one arriving from the engine.
	mutating func accept(_ event: EngineEvent) -> [EngineEvent] {
		guard case .caption(let update) = event else {
			if case .state(let state) = event, state != .captioning { pending = nil }
			return [event]
		}
		if update.isFinal {
			pending = nil
			return [event]
		}
		if isDue {
			pending = nil
			lastVolatileSent = now()
			return [event]
		}
		pending = event
		return []
	}

	/// The pending volatile caption, once its interval has passed.
	mutating func takeDue() -> EngineEvent? {
		guard let event = pending, isDue else { return nil }
		pending = nil
		lastVolatileSent = now()
		return event
	}

	/// Seconds until the pending volatile caption may be sent; nil when none is waiting.
	var dueIn: Double? {
		guard pending != nil, let last = lastVolatileSent else { return nil }
		return max(0, interval - (now() - last))
	}

	private var isDue: Bool {
		guard let last = lastVolatileSent else { return true }
		return now() - last >= interval
	}
}
