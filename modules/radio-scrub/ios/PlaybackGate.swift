/// Waits for a network cushion at startup and after underflow.
struct PlaybackGate {
	let cushionFrames: Int
	private var primed = false

	init(_ cushionFrames: Int) { self.cushionFrames = cushionFrames }

	mutating func canRender(_ available: Int, _ requested: Int) -> Bool {
		if available < requested { primed = false }
		if !primed && available >= max(cushionFrames, requested) { primed = true }
		return primed
	}
}
