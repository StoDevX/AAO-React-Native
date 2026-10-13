import AVFoundation
import Foundation

@main
struct PCMBufferTests {
	static func main() {
		let queue = PCMBuffer()
		let samples = UnsafeMutablePointer<Float>.allocate(capacity: 40000 * 2)
		defer { samples.deallocate() }
		for frame in 0..<40000 {
			samples[frame * 2] = Float(frame) / 100000
			samples[frame * 2 + 1] = -samples[frame * 2]
		}
		let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!
		let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 512)!
		let left = output.floatChannelData![0]
		let right = output.floatChannelData![1]

		queue.enqueue(samples, 100)
		queue.render(100, output.mutableAudioBufferList)
		precondition(
			!queue.rendering.load(ordering: .relaxed) && left[99] == 0,
			"A partial startup cushion must render silence without consuming samples")
		queue.enqueue(samples.advanced(by: 200), 39900)
		var consumed = 0
		while consumed < 40000 {
			let count = min(512, 40000 - consumed)
			queue.render(count, output.mutableAudioBufferList)
			precondition(queue.rendering.load(ordering: .relaxed))
			for frame in 0..<count {
				let gain = min(1, Float(consumed + frame + 1) / 240)
				precondition(
					abs(left[frame] - Float(consumed + frame) / 100000 * gain) < 0.000001,
					"The queue must preserve decoded samples and fade in over 240 frames")
				precondition(left[frame] == -right[frame], "Channels must remain paired")
			}
			consumed += count
		}
		queue.render(512, output.mutableAudioBufferList)
		precondition(
			!queue.rendering.load(ordering: .relaxed) && left[511] == 0,
			"Underflow must silence the complete render block")
		// Repeated refill/drain crosses the physical ring boundary several times.
		for _ in 0..<12 {
			queue.enqueue(samples, 40000)
			queue.render(400, output.mutableAudioBufferList)
			precondition(
				abs(left[399] - samples[798]) < 0.000001,
				"Recovery must restart with the new samples after its fade")
			for _ in 0..<99 { queue.render(400, output.mutableAudioBufferList) }
			queue.render(400, output.mutableAudioBufferList)
			precondition(left[399] == 0, "Draining a wrapped queue must underflow cleanly")
		}
		print("PCM startup, sample order, gain ramp, underflow and ring wrapping passed")
	}
}
