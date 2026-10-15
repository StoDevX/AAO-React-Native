/// Decides whether audio is speech or music from the classifier's scores.
///
/// A window's scores are averaged with the few before it, and the state changes only when
/// the other class leads by `margin`, so one noisy window or a speaker over a quiet music
/// bed does not flap the gate. It starts as music: nothing is captioned until speech is
/// heard, and the pre-roll buffer recovers the first words.
public struct MusicGate {
	public enum State: Equatable, Sendable { case speech, music }

	public private(set) var state: State = .music
	private var recent: [(speech: Double, music: Double)] = []
	private let smoothing: Int
	private let margin: Double

	public init(smoothing: Int = 3, margin: Double = 0.1) {
		self.smoothing = smoothing
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
