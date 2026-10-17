import AVFoundation
import Foundation

enum MusicFixture {
	/// A few bars of plucked chords over a bass line, rendered here as 48 kHz stereo in
	/// half-second buffers. It is made in code so the repo holds no recording to license.
	static func buffers(seconds: Double) -> [AVAudioPCMBuffer] {
		let rate = 48_000.0
		let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: rate, channels: 2, interleaved: false)!
		let total = Int(seconds * rate)
		var samples = [Float](repeating: 0, count: total)
		// C, Am, F and G, two beats each at 100 bpm, the chord's notes arpeggiated in eighths.
		let chords: [[Double]] = [
			[261.63, 329.63, 392.00, 523.25], [220.00, 261.63, 329.63, 440.00],
			[174.61, 220.00, 261.63, 349.23], [196.00, 246.94, 293.66, 392.00],
		]
		let eighth = 60.0 / 100.0 / 2
		var note = 0
		while Double(note) * eighth < seconds {
			let chord = chords[(note / 4) % chords.count]
			pluck(frequency: chord[note % 4], at: Double(note) * eighth, into: &samples, rate: rate, gain: 0.25)
			if note % 2 == 0 { pluck(frequency: chord[0] / 2, at: Double(note) * eighth, into: &samples, rate: rate, gain: 0.35) }
			note += 1
		}
		var result: [AVAudioPCMBuffer] = []
		let chunk = Int(rate / 2)
		var start = 0
		while start < total {
			let count = min(chunk, total - start)
			let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(count))!
			buffer.frameLength = AVAudioFrameCount(count)
			for channel in 0..<2 {
				for frame in 0..<count { buffer.floatChannelData![channel][frame] = samples[start + frame] }
			}
			result.append(buffer)
			start += count
		}
		return result
	}

	/// One decaying note with its first harmonics, added into `samples` from `time`.
	private static func pluck(frequency: Double, at time: Double, into samples: inout [Float], rate: Double, gain: Double) {
		let first = Int(time * rate)
		let length = Int(0.9 * rate)
		for index in 0..<length where first + index < samples.count {
			let t = Double(index) / rate
			var value = 0.0
			for (harmonic, weight) in [(1.0, 1.0), (2.0, 0.5), (3.0, 0.25), (4.0, 0.12)] {
				value += weight * sin(2 * .pi * frequency * harmonic * t)
			}
			samples[first + index] += Float(gain * value * exp(-4 * t) * min(1, t * 400))
		}
	}
}
