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

	/// Real synthesized speech as an ADTS AAC file, the way a progressive radio stream carries
	/// it, with the seconds of speech it holds. One encode, since the stream parser rejects
	/// separately encoded files joined end to end.
	static func aacFile(saying text: String) throws -> AACFile {
		let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
		try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
		let aiff = directory.appendingPathComponent("speech.aiff")
		let aac = directory.appendingPathComponent("speech.aac")
		try run("/usr/bin/say", ["-o", aiff.path, "--", text])
		try run("/usr/bin/afconvert", ["-f", "adts", "-d", "aac", aiff.path, aac.path])
		let file = try AVAudioFile(forReading: aiff)
		return AACFile(url: aac, seconds: Double(file.length) / file.processingFormat.sampleRate, directory: directory)
	}

	/// An encoded file and the temporary directory that holds it; `remove()` deletes both.
	struct AACFile {
		let url: URL
		let seconds: Double
		let directory: URL
		func remove() { try? FileManager.default.removeItem(at: directory) }
	}

	private static func run(_ tool: String, _ arguments: [String]) throws {
		let process = Process()
		process.executableURL = URL(fileURLWithPath: tool)
		process.arguments = arguments
		try process.run()
		process.waitUntilExit()
		guard process.terminationStatus == 0 else { throw FixtureError.toolFailed(tool) }
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

	enum FixtureError: Error { case noConverter, toolFailed(String) }
}
