/// Decides whether audio is speech or music from the classifier's scores.
///
/// A window's scores are averaged with the few before it, and the state changes only when
/// the other class leads by `margin`, so one noisy window or a speaker over a quiet music
/// bed does not flap the gate. It starts as music: nothing is captioned until speech is
/// heard, and the pre-roll buffer recovers the first words.
///
/// The default margin is 0.2 because of a probe of the KRLX and KSTO streams on 2026-10-14:
/// clean speech sat at least 0.33 above the music ceiling, 0.1 admitted three short false
/// opens, and 0.3 began to drop ads that carry jingles. A `smoothing` below 1 counts as 1.
public struct MusicGate {
	public enum State: Equatable, Sendable { case speech, music }

	public private(set) var state: State = .music
	private var recent: [(speech: Double, music: Double)] = []
	private let smoothing: Int
	private let margin: Double

	public init(smoothing: Int = 3, margin: Double = 0.2) {
		self.smoothing = max(1, smoothing)
		self.margin = margin
	}

	@discardableResult
	public mutating func observe(speech: Double, music: Double) -> State {
		recent.append((speech, music))
		if recent.count > smoothing { recent.removeFirst() }
		let speechMean = recent.map(\.speech).reduce(0, +) / Double(recent.count)
		let musicMean = recent.map(\.music).reduce(0, +) / Double(recent.count)
		switch state {
		case .music where speechMean - musicMean > margin: state = .speech
		case .speech where musicMean - speechMean > margin: state = .music
		default: break
		}
		return state
	}
}
