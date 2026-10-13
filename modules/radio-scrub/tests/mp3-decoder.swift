import AudioToolbox
import Foundation

@main
struct MP3DecoderTests {
	static func main() throws {
		let bytes = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
		precondition(!bytes.isEmpty)
		var frames = 0
		var energy = 0.0
		var stereoError = 0.0
		let decoder = MP3Decoder { samples, count in
			frames += count
			for frame in 0..<count {
				precondition(samples[frame * 2].isFinite, "Non-finite decoded sample")
				energy += Double(samples[frame * 2] * samples[frame * 2])
				stereoError += Double(abs(samples[frame * 2] + samples[frame * 2 + 1]))
			}
		}
		var position = 0
		while position < bytes.count {
			let count = min(bytes.count - position, position % 997 + 1)
			let result = decoder.feed(bytes.subdata(in: position..<(position + count)))
			precondition(result == noErr, "Decode failed: \(result)")
			position += count
		}
		precondition(
			(45000...52000).contains(frames) && energy > 100
				&& stereoError / Double(frames) < 0.001,
			"Unexpected decoded audio: frames=\(frames) energy=\(energy) stereoError=\(stereoError)"
		)
		print("Fragmented MP3 decoded to stereo 48 kHz PCM: \(frames) frames")
	}
}
