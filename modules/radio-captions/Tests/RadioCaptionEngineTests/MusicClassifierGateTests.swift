import AVFoundation
import XCTest
@testable import RadioCaptionEngine

/// The real sound classifier and gate over real audio: `say` speech, then music.
final class MusicClassifierGateTests: XCTestCase {
	private let streamFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 48_000, channels: 2, interleaved: false)!
	private let sentence = "Good evening, and welcome back to the show. Tonight we will talk about the weather, the campus news, and the game on Saturday. "

	/// The scores for each classifier window over `buffers`, in order.
	private func windowScores(of buffers: [AVAudioPCMBuffer]) throws -> [(speech: Double, music: Double)] {
		var scores: [(speech: Double, music: Double)] = []
		let classifier = try MusicClassifier(format: streamFormat) { scores.append((speech: $0, music: $1)) }
		var frames: AVAudioFramePosition = 0
		for buffer in buffers {
			classifier.analyze(buffer, framePosition: frames)
			frames += AVAudioFramePosition(buffer.frameLength)
		}
		classifier.finish()
		return scores
	}

	func testGateOpensOnSpeechThenClosesOnMusic() throws {
		let speech = try SpeechFixture.buffers(saying: String(repeating: sentence, count: 3), as: streamFormat)
		let music = MusicFixture.buffers(seconds: 15)
		let speechSeconds = SpeechFixture.duration(of: speech)
		XCTAssertGreaterThan(speechSeconds, 10)

		let scores = try windowScores(of: speech + music)
		var gate = MusicGate()
		var stateAfterSpeech: MusicGate.State?
		for (index, score) in scores.enumerated() {
			// Window `index` ends 3 s plus a 1.5 s hop per earlier window into the audio.
			let windowEnd = 3 + 1.5 * Double(index)
			if windowEnd > speechSeconds, stateAfterSpeech == nil { stateAfterSpeech = gate.state }
			gate.observe(speech: score.speech, music: score.music)
		}
		XCTAssertEqual(stateAfterSpeech, .speech)
		XCTAssertEqual(gate.state, .music)
	}
}
