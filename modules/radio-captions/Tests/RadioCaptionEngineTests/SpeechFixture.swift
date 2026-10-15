import AVFoundation
import Foundation

enum SpeechFixture {
	/// Real synthesized speech from the macOS `say` command, in half-second buffers. With a
	/// `format`, the speech is resampled to it first, as a decoded stream arrives at its own
	/// rate and channel count.
	static func buffers(saying text: String, as format: AVAudioFormat? = nil) throws -> [AVAudioPCMBuffer] {
		let file = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).aiff")
		defer { try? FileManager.default.removeItem(at: file) }
		let say = Process()
		say.executableURL = URL(fileURLWithPath: "/usr/bin/say")
		say.arguments = ["-o", file.path, "--", text]
		try say.run()
		say.waitUntilExit()
		let audio = try AVAudioFile(forReading: file)
		let chunk = AVAudioFrameCount(audio.processingFormat.sampleRate / 2)
		var result: [AVAudioPCMBuffer] = []
		while audio.framePosition < audio.length {
			let buffer = AVAudioPCMBuffer(pcmFormat: audio.processingFormat, frameCapacity: chunk)!
			try audio.read(into: buffer)
			result.append(buffer)
		}
		guard let format else { return result }
		return try result.map { try resample($0, to: format) }
	}

	/// The seconds of audio in `buffers`.
	static func duration(of buffers: [AVAudioPCMBuffer]) -> Double {
		buffers.reduce(0) { $0 + Double($1.frameLength) / $1.format.sampleRate }
	}

	private static func resample(_ buffer: AVAudioPCMBuffer, to format: AVAudioFormat) throws -> AVAudioPCMBuffer {
		guard let converter = AVAudioConverter(from: buffer.format, to: format) else {
			throw FixtureError.noConverter
		}
		let capacity = AVAudioFrameCount(Double(buffer.frameLength) * format.sampleRate / buffer.format.sampleRate) + 1
		let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity)!
		var supplied = false
		var error: NSError?
		converter.convert(to: output, error: &error) { _, status in
			if supplied { status.pointee = .noDataNow; return nil }
			supplied = true
			status.pointee = .haveData
			return buffer
		}
		if let error { throw error }
		return output
	}

	enum FixtureError: Error { case noConverter }
}
