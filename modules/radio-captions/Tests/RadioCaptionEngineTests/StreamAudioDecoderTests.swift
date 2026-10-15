import AVFoundation
import Foundation
import Testing
@testable import RadioCaptionEngine

struct StreamAudioDecoderTests {
	private struct Fixture {
		let url: URL
		let seconds: Double
	}

	/// The sentence said `sentences` times, as ADTS AAC.
	private func makeFixture(sentences: Int = 1) throws -> Fixture {
		let sentence = "This is the radio station, broadcasting live from the hill, with music and news all afternoon long. "
		let speech = try SpeechFixture.aacFile(saying: String(repeating: sentence, count: sentences))
		return Fixture(url: speech.url, seconds: speech.seconds)
	}

	private func collectStatuses(_ decoder: StreamAudioDecoder) -> Task<[String], Never> {
		Task {
			var seen: [String] = []
			for await status in decoder.status {
				switch status {
				case .connecting: seen.append("connecting")
				case .playing: seen.append("playing")
				case .failed(let reason): seen.append("failed: \(reason)")
				}
			}
			return seen
		}
	}

	private func rmsDecibels(_ buffers: [DecodedAudio]) -> Double {
		var sum = 0.0
		var count = 0
		for decoded in buffers {
			let buffer = decoded.buffer
			guard let channels = buffer.floatChannelData else { continue }
			for channel in 0..<Int(buffer.format.channelCount) {
				for frame in 0..<Int(buffer.frameLength) {
					let sample = Double(channels[channel][frame])
					sum += sample * sample
					count += 1
				}
			}
		}
		guard count > 0, sum > 0 else { return -.infinity }
		return 10 * log10(sum / Double(count))
	}

	@Test func decodesAStreamToLoudPCMAndFinishesAtTheEnd() async throws {
		let fixture = try makeFixture()
		let decoder = StreamAudioDecoder(url: fixture.url)
		let statuses = collectStatuses(decoder)

		var buffers: [DecodedAudio] = []
		for await decoded in decoder.start() { buffers.append(decoded) }
		decoder.stop()

		let frames = buffers.reduce(0) { $0 + Int($1.buffer.frameLength) }
		let first = try #require(buffers.first)
		let seconds = Double(frames) / first.buffer.format.sampleRate
		#expect(abs(seconds - fixture.seconds) / fixture.seconds < 0.15)
		#expect(first.startSeconds == 0)
		#expect(first.buffer.format.sampleRate > 0)
		#expect(first.buffer.format.channelCount >= 1)
		#expect(first.buffer.format.commonFormat == .pcmFormatFloat32)
		#expect(!first.buffer.format.isInterleaved)
		#expect(buffers.allSatisfy { $0.buffer.format.sampleRate == first.buffer.format.sampleRate })
		#expect(rmsDecibels(buffers) > -50)

		let starts = buffers.map(\.startSeconds)
		#expect(starts == starts.sorted())
		let seen = await statuses.value
		#expect(seen.contains("playing"))
		// A live station never ends, so the end of the data is reported for the engine to reconnect.
		#expect(seen.last == "failed: The stream ended.")
	}

	@Test func stopFinishesTheStreamWhileDataIsStillArriving() async throws {
		let fixture = try makeFixture(sentences: 30)
		let decoder = StreamAudioDecoder(url: fixture.url)
		let statuses = collectStatuses(decoder)

		var seconds = 0.0
		for await decoded in decoder.start() {
			seconds += Double(decoded.buffer.frameLength) / decoded.buffer.format.sampleRate
			decoder.stop()
			decoder.stop()
		}

		#expect(seconds < fixture.seconds / 2)
		let seen = await statuses.value
		#expect(!seen.contains { $0.hasPrefix("failed") })
	}

	@Test func aSecondStartEndsTheFirstRun() async throws {
		let fixture = try makeFixture(sentences: 30)
		let decoder = StreamAudioDecoder(url: fixture.url)
		let firstRun = decoder.start()
		let secondRun = decoder.start()

		var firstCount = 0
		for await _ in firstRun { firstCount += 1 }
		var secondCount = 0
		for await _ in secondRun {
			secondCount += 1
			if secondCount == 3 { decoder.stop() }
		}
		decoder.stop()
		decoder.stop()
		#expect(secondCount >= 3)
	}

	@Test func anUnreachableURLFailsAndFinishes() async throws {
		let decoder = StreamAudioDecoder(url: URL(string: "http://127.0.0.1:1/stream")!)
		let statuses = collectStatuses(decoder)

		var count = 0
		for await _ in decoder.start() { count += 1 }
		decoder.stop()

		#expect(count == 0)
		let seen = await statuses.value
		#expect(seen.contains { $0.hasPrefix("failed") })
		#expect(!seen.contains("playing"))
	}

	@Test func aMissingFileFailsAndFinishes() async throws {
		let decoder = StreamAudioDecoder(url: URL(fileURLWithPath: "/nonexistent/stream.aac"))
		let statuses = collectStatuses(decoder)

		for await _ in decoder.start() {}
		decoder.stop()

		let seen = await statuses.value
		#expect(seen.contains { $0.hasPrefix("failed") })
	}
}
