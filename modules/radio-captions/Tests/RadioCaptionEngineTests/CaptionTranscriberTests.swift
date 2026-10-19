import AVFoundation
import XCTest
@testable import RadioCaptionEngine

/// These run the real on-device speech model against real `say` audio. A machine without the
/// en-US model skips them, naming the model, rather than failing.
final class CaptionTranscriberTests: XCTestCase {
	private let phrase = "Good evening, you are listening to K R L X"
	private let secondPhrase = "The weather tomorrow will be sunny and warm"

	private func preparedTranscriber() async throws -> CaptionTranscriber {
		let transcriber = CaptionTranscriber(locale: Locale(identifier: "en-US"))
		do { try await transcriber.prepare() } catch CaptionError.assetsUnavailable {
			throw XCTSkip("the en-US speech model is not installed on this machine")
		}
		return transcriber
	}

	/// Feeds each buffer at its place in stream time, from `start`, and returns where it ended.
	private func feed(_ buffers: [AVAudioPCMBuffer], to transcriber: CaptionTranscriber, from start: Double) -> Double {
		var time = start
		for buffer in buffers {
			transcriber.feed(buffer, startSeconds: time)
			time += Double(buffer.frameLength) / buffer.format.sampleRate
		}
		return time
	}

	private func finals(from updates: AsyncThrowingStream<CaptionUpdate, Error>) async throws -> [CaptionUpdate] {
		var finals: [CaptionUpdate] = []
		for try await update in updates where update.isFinal { finals.append(update) }
		return finals
	}

	func testTranscribesSynthesizedSpeech() async throws {
		let transcriber = try await preparedTranscriber()
		let updates = try await transcriber.start()
		_ = feed(try SpeechFixture.buffers(saying: phrase), to: transcriber, from: 0)
		await transcriber.finish()
		let text = try await finals(from: updates).map(\.text).joined(separator: " ").lowercased()
		XCTAssertTrue(text.contains("listening"), "got: \(text)")
	}

	func testTranscribesStreamFormatAudio() async throws {
		let transcriber = try await preparedTranscriber()
		let streamFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 48_000, channels: 2, interleaved: false)!
		let updates = try await transcriber.start()
		_ = feed(try SpeechFixture.buffers(saying: phrase, as: streamFormat), to: transcriber, from: 0)
		await transcriber.finish()
		let text = try await finals(from: updates).map(\.text).joined(separator: " ").lowercased()
		XCTAssertTrue(text.contains("listening"), "got: \(text)")
	}

	func testKeepsTheGapBetweenTwoStretchesOfSpeech() async throws {
		let transcriber = try await preparedTranscriber()
		let updates = try await transcriber.start()
		let first = try SpeechFixture.buffers(saying: phrase)
		let second = try SpeechFixture.buffers(saying: secondPhrase)
		let firstEnd = feed(first, to: transcriber, from: 0)
		let secondStart = firstEnd + 3
		_ = feed(second, to: transcriber, from: secondStart)
		await transcriber.finish()
		let results = try await finals(from: updates)
		let listening = results.first { $0.text.lowercased().contains("listening") }
		let weather = results.first { $0.text.lowercased().contains("weather") }
		XCTAssertNotNil(listening, "got: \(results)")
		XCTAssertNotNil(weather, "got: \(results)")
		XCTAssertLessThan(listening?.startSeconds ?? .infinity, firstEnd)
		XCTAssertGreaterThanOrEqual(weather?.startSeconds ?? 0, secondStart - 0.5)
	}
}
