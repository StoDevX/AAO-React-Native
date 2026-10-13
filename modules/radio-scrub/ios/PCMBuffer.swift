import AVFoundation
import Synchronization

/// A single network producer and audio consumer. Release/acquire publishes samples
/// before the other thread reads them or reuses their slots.
final class PCMBuffer {
	private static let capacity = 48000 * 4
	private let queue = UnsafeMutablePointer<Float>.allocate(capacity: capacity * 2)
	private let written = Atomic<Int>(0)
	private let read = Atomic<Int>(0)
	private let resetThrough = Atomic<Int>(-1)
	let rendering = Atomic<Bool>(false)
	let record = RecordBuffer()
	private var gate = PlaybackGate(48000 * 3 / 4)
	private var renderGain: Float = 0
	private let input = UnsafeMutablePointer<Float>.allocate(capacity: 2)
	private let result = UnsafeMutablePointer<Float>.allocate(capacity: 2)

	init() {
		queue.initialize(repeating: 0, count: Self.capacity * 2)
		input.initialize(repeating: 0, count: 2)
		result.initialize(repeating: 0, count: 2)
		record.prepare(48000, 2)
	}

	deinit {
		queue.deallocate()
		input.deallocate()
		result.deallocate()
	}

	/// The producer must be stopped before requesting a new live epoch.
	/// The audio consumer discards only the old samples, preserving new arrivals.
	func requestLiveReset() {
		resetThrough.store(written.load(ordering: .acquiring), ordering: .releasing)
		rendering.store(false, ordering: .relaxed)
	}

	/// Called only by the serial network delegate queue; excess audio is dropped.
	func enqueue(_ samples: UnsafePointer<Float>, _ frames: Int) {
		var head = written.load(ordering: .relaxed)
		let tail = read.load(ordering: .acquiring)
		for frame in 0..<min(frames, Self.capacity - (head - tail)) {
			let slot = (head % Self.capacity) * 2
			queue[slot] = samples[frame * 2]
			queue[slot + 1] = samples[frame * 2 + 1]
			head += 1
		}
		written.store(head, ordering: .releasing)
	}

	/// Called only by the audio thread; no locks or allocations occur here.
	func render(_ frames: Int, _ output: UnsafeMutablePointer<AudioBufferList>) {
		let cutoff = resetThrough.exchange(-1, ordering: .acquiringAndReleasing)
		if cutoff >= 0 {
			read.store(cutoff, ordering: .releasing)
			gate = PlaybackGate(48000 * 3 / 4)
			renderGain = 0
			record.resetForLive()
		}
		record.beginBlock()
		var tail = read.load(ordering: .relaxed)
		let head = written.load(ordering: .acquiring)
		let canRender = gate.canRender(head - tail, frames)
		rendering.store(canRender, ordering: .relaxed)
		if !canRender { renderGain = 0 }
		let buffers = UnsafeMutableAudioBufferListPointer(output)
		for frame in 0..<frames {
			result[0] = 0
			result[1] = 0
			if canRender {
				let slot = (tail % Self.capacity) * 2
				input[0] = queue[slot]
				input[1] = queue[slot + 1]
				tail += 1
				record.processFrame(input, result)
				renderGain = min(1, renderGain + 1.0 / 240)
				result[0] *= renderGain
				result[1] *= renderGain
			}
			for channel in 0..<2 {
				buffers[channel].mData!.assumingMemoryBound(to: Float.self)[frame] =
					result[channel]
			}
		}
		read.store(tail, ordering: .releasing)
		record.endBlock()
	}
}
