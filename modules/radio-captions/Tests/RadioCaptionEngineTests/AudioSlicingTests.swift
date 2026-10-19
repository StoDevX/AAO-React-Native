import AVFoundation
import XCTest
@testable import RadioCaptionEngine

final class AudioSlicingTests: XCTestCase {
	private func oneBuffer(seconds: Double) throws -> AVAudioPCMBuffer {
		let pieces = MusicFixture.buffers(seconds: seconds)
		let format = pieces[0].format
		let total = pieces.reduce(0) { $0 + Int($1.frameLength) }
		let joined = try XCTUnwrap(AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(total)))
		for piece in pieces {
			for channel in 0..<Int(format.channelCount) {
				joined.floatChannelData![channel].advanced(by: Int(joined.frameLength))
					.update(from: piece.floatChannelData![channel], count: Int(piece.frameLength))
			}
			joined.frameLength += piece.frameLength
		}
		return joined
	}

	func testSlicesHoldEveryFrameOnceAndInOrder() throws {
		let buffer = try oneBuffer(seconds: 5.3)
		let slices = buffer.slices(maxFrames: 24_000)
		XCTAssertEqual(slices.count, 11)
		XCTAssertTrue(slices.dropLast().allSatisfy { $0.frameLength == 24_000 })
		XCTAssertEqual(slices.reduce(0) { $0 + Int($1.frameLength) }, Int(buffer.frameLength))
		var position = 0
		for slice in slices {
			for channel in 0..<Int(buffer.format.channelCount) {
				for frame in 0..<Int(slice.frameLength) {
					XCTAssertEqual(slice.floatChannelData![channel][frame], buffer.floatChannelData![channel][position + frame])
				}
			}
			position += Int(slice.frameLength)
		}
	}

	func testABufferWithinTheLimitIsOneSlice() throws {
		let buffer = try oneBuffer(seconds: 0.4)
		XCTAssertEqual(buffer.slices(maxFrames: 24_000).count, 1)
	}
}
