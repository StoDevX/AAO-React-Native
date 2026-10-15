import Testing
@testable import RadioCaptionEngine

struct MusicGateTests {
	@Test func startsClosedAsMusic() {
		#expect(MusicGate().state == .music)
	}

	@Test func opensOnSustainedSpeech() {
		var gate = MusicGate()
		for _ in 0..<3 { _ = gate.observe(speech: 0.8, music: 0.1) }
		#expect(gate.state == .speech)
	}

	@Test func oneNoisyWindowDoesNotFlipIt() {
		var gate = MusicGate()
		for _ in 0..<3 { _ = gate.observe(speech: 0.8, music: 0.1) }
		_ = gate.observe(speech: 0.1, music: 0.9)
		#expect(gate.state == .speech)
	}

	@Test func closesOnSustainedMusic() {
		var gate = MusicGate()
		for _ in 0..<3 { _ = gate.observe(speech: 0.8, music: 0.1) }
		for _ in 0..<3 { _ = gate.observe(speech: 0.1, music: 0.9) }
		#expect(gate.state == .music)
	}

	@Test func closeScoresHoldTheState() {
		var gate = MusicGate()
		for _ in 0..<3 { _ = gate.observe(speech: 0.8, music: 0.1) }
		for _ in 0..<5 { _ = gate.observe(speech: 0.45, music: 0.5) }
		#expect(gate.state == .speech)
	}
}
