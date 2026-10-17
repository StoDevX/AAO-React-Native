import AVFoundation
import Testing
@testable import RadioCaptionEngine

struct PreRollBufferTests {
	private func chunk(seconds: Double) -> AVAudioPCMBuffer {
		let format = AVAudioFormat(standardFormatWithSampleRate: 16_000, channels: 1)!
		let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(16_000 * seconds))!
		buffer.frameLength = buffer.frameCapacity
		return buffer
	}

	@Test func keepsOnlyTheLastSeconds() {
		var preRoll = PreRollBuffer(maxSeconds: 1)
		for index in 0..<5 { preRoll.append(chunk(seconds: 0.5), startSeconds: Double(index) * 0.5) }
		let drained = preRoll.drain()
		#expect(drained.map(\.startSeconds) == [1.5, 2.0])
	}

	@Test func drainEmptiesIt() {
		var preRoll = PreRollBuffer(maxSeconds: 1)
		preRoll.append(chunk(seconds: 0.5), startSeconds: 0)
		_ = preRoll.drain()
		#expect(preRoll.drain().isEmpty)
	}
}
