import Foundation
import Synchronization

/// One audio-thread writer/reader; other threads access only the atomic controls.
/// Sample memory is allocated during prepare, never in the render callback.
final class RecordBuffer {
	static let maxChannels = 8
	let pitch = Atomic<Double>(0)
	let quartzLocked = Atomic<Bool>(true)
	/// 0: none, 1: live edge, 2: oldest retained audio.
	let bufferLimit = Atomic<Int>(0)
	let ready = Atomic<Bool>(false)
	let availableSeconds = Atomic<Double>(0)
	let delaySeconds = Atomic<Double>(0)
	private let controlsRevision = Atomic<UInt64>(0)
	private let command = Atomic<Int>(0)
	private let desiredRate = Atomic<Double>(0)
	private var appliedRevision: UInt64 = 0
	private var samples: UnsafeMutablePointer<Float>?
	private let last = UnsafeMutablePointer<Float>.allocate(capacity: maxChannels)
	private let fadeFrom = UnsafeMutablePointer<Float>.allocate(capacity: maxChannels)
	private var sampleRate = 1.0
	private var channels = 0
	private var capacity = 0
	private var head = 0
	private var cursor = 0.0
	private var rate = 1.0
	private var targetRate = 0.0
	private var gain = 1.0
	private var coastDecay = 1.0
	private var smoothing = 1.0
	private var boundaryStep = 0.0
	private var fade = 0
	private var live = true
	private var held = false
	private var coasting = false

	init() {
		last.initialize(repeating: 0, count: Self.maxChannels)
		fadeFrom.initialize(repeating: 0, count: Self.maxChannels)
	}

	deinit {
		samples?.deallocate()
		last.deallocate()
		fadeFrom.deallocate()
	}

	func prepare(_ sampleRate: Double, _ channels: Int) {
		ready.store(false, ordering: .sequentiallyConsistent)
		self.sampleRate = sampleRate
		self.channels = channels
		capacity = Int(ceil(sampleRate * 30))
		samples?.deallocate()
		samples = .allocate(capacity: capacity * channels)
		samples!.initialize(repeating: 0, count: capacity * channels)
		resetForLive()

		ready.store(true, ordering: .sequentiallyConsistent)
	}

	/// Called only by the audio consumer, without clearing or reallocating history.
	/// Resetting head bounds reads to samples captured after this reset.
	func resetForLive() {
		head = 0
		cursor = 0
		live = true
		held = false
		coasting = false
		boundaryStep = 0
		appliedRevision = controlsRevision.load(ordering: .sequentiallyConsistent)
		rate = 1
		targetRate = 0
		pitch.store(0, ordering: .sequentiallyConsistent)
		quartzLocked.store(true, ordering: .sequentiallyConsistent)
		bufferLimit.store(0, ordering: .sequentiallyConsistent)
		gain = 1
		fade = 0
		last.update(repeating: 0, count: Self.maxChannels)
		coastDecay = exp(-1 / (sampleRate * 0.3))
		smoothing = 1 - exp(-1 / (sampleRate * 0.005))
		command.store(0, ordering: .sequentiallyConsistent)
		desiredRate.store(0, ordering: .sequentiallyConsistent)
		availableSeconds.store(0, ordering: .sequentiallyConsistent)
		delaySeconds.store(0, ordering: .sequentiallyConsistent)
	}

	func begin() {
		desiredRate.store(0, ordering: .sequentiallyConsistent)
		command.store(1, ordering: .sequentiallyConsistent)
	}

	func move(_ rate: Double) { desiredRate.store(boundedRate(rate), ordering: .sequentiallyConsistent) }

	func release(_ rate: Double) {
		desiredRate.store(boundedRate(rate), ordering: .sequentiallyConsistent)
		command.store(2, ordering: .sequentiallyConsistent)
	}

	func setPitch(_ percent: Double) {
		quartzLocked.store(false, ordering: .sequentiallyConsistent)
		pitch.store(
			percent.isFinite ? min(8, max(-8, percent)) : 0, ordering: .sequentiallyConsistent)
		bufferLimit.store(0, ordering: .sequentiallyConsistent)
		controlsRevision.wrappingAdd(1, ordering: .sequentiallyConsistent)
	}

	func setQuartzLocked(_ locked: Bool) {
		quartzLocked.store(locked, ordering: .sequentiallyConsistent)
		if locked { pitch.store(0, ordering: .sequentiallyConsistent) }
		bufferLimit.store(0, ordering: .sequentiallyConsistent)
		controlsRevision.wrappingAdd(1, ordering: .sequentiallyConsistent)
	}

	func goLive() {
		setQuartzLocked(true)
		command.store(3, ordering: .sequentiallyConsistent)
	}

	func beginBlock() {
		let revision = controlsRevision.load(ordering: .sequentiallyConsistent)
		if revision != appliedRevision {
			appliedRevision = revision
			boundaryStep = 0
		}
		switch command.exchange(0, ordering: .sequentiallyConsistent) {
		case 1:
			if live { cursor = Double(head) }
			live = false
			held = true
			rate = 0
			break
		case 2:
			if !live {
				if cursor >= Double(head)
					&& desiredRate.load(ordering: .sequentiallyConsistent) > 0
				{
					returnToLive(true)
					break
				}
				held = false
				coasting = true
				rate = desiredRate.load(ordering: .sequentiallyConsistent)
			}
			break
		case 3:
			returnToLive(true)
			break
		default:
			break
		}
		targetRate = desiredRate.load(ordering: .sequentiallyConsistent)
		if live && pitch.load(ordering: .sequentiallyConsistent) < 0 {
			cursor = Double(head)
			live = false
		}
	}

	func processFrame(_ input: UnsafePointer<Float>, _ output: UnsafeMutablePointer<Float>) {
		let liveFrame = head
		for channel in 0..<channels {
			samples![(head % capacity) * channels + channel] = input[channel]
		}
		head += 1

		// The capture always advances at 1x; only the dry playback cursor changes speed.
		var selectedPitch = pitch.load(ordering: .sequentiallyConsistent)
		if live && selectedPitch == 0 && fade == 0 {
			gain += smoothing * (1 - gain)
			for channel in 0..<channels {
				output[channel] = input[channel]
				last[channel] = input[channel]
			}
			cursor = Double(head)
			return
		}
		let oldest = max(0, head - capacity)
		if !held && selectedPitch != 0 {
			let remaining =
				selectedPitch > 0
				? (Double(liveFrame) - cursor) / sampleRate
				: (cursor - Double(oldest)) / sampleRate
			let cap = 8 * min(1, max(0, remaining / 3))
			// A distance-only cap decays asymptotically as playback approaches the
			// edge. Once within three seconds of audio, finish centering in five
			// seconds of playback even as the changing speed slows that approach.
			if remaining <= 3 && boundaryStep == 0 {
				boundaryStep = abs(selectedPitch) / (sampleRate * 5)
			}
			if boundaryStep > 0 {
				let magnitude = min(cap, max(0, abs(selectedPitch) - boundaryStep))
				var corrected = copysign(magnitude, selectedPitch)
				if abs(corrected) < 0.05 { corrected = 0 }
				// Do not overwrite a slider command that arrived during this frame.
				if pitch.compareExchange(
					expected: selectedPitch, desired: corrected,
					ordering: .sequentiallyConsistent
				).exchanged {
					bufferLimit.store(
						selectedPitch > 0 ? 1 : 2, ordering: .sequentiallyConsistent)
					selectedPitch = corrected
				}
			}
		}
		let selectedRate = 1 + selectedPitch / 100
		let returningFromScratch = coasting
		if !live {
			rate =
				held
				? rate + smoothing * (targetRate - rate)
				: coasting ? selectedRate + (rate - selectedRate) * coastDecay : selectedRate
			if !held && abs(rate - selectedRate) < 0.005 {
				rate = selectedRate
				coasting = false
			}
			cursor = min(Double(liveFrame), max(Double(oldest), cursor))
		}
		let silent = !live && (abs(rate) < 0.01 || (cursor <= Double(oldest) && rate < 0))
		gain += smoothing * ((silent ? 0 : 1) - gain)

		for channel in 0..<channels {
			var value = input[channel]
			if !live {
				let first = Int(cursor)
				let second = min(first + 1, liveFrame)
				let fraction = cursor - Double(first)
				let a = samples![(first % capacity) * channels + channel]
				let b = samples![(second % capacity) * channels + channel]
				value = Float((Double(a) + fraction * Double(b - a)) * gain)
			}
			if fade > 0 {
				let progress = Float(1) - Float(fade) / 128
				value = fadeFrom[channel] * (1 - progress) + value * progress
			}
			output[channel] = value
			last[channel] = value
		}
		if fade > 0 { fade -= 1 }
		if live {
			cursor = Double(head)
		} else {
			cursor += rate
			if !held && cursor >= Double(head) && rate >= 1 {
				returnToLive(returningFromScratch)
			}
		}
	}

	func endBlock() {
		availableSeconds.store(
			Double(min(head, capacity)) / sampleRate, ordering: .sequentiallyConsistent)
		delaySeconds.store(
			live ? 0 : min(30, max(0, (Double(head) - cursor) / sampleRate)),
			ordering: .sequentiallyConsistent)
	}

	/// A released forward scratch uses the same centered, locked transition as Go Live.
	private func returnToLive(_ resetControls: Bool) {
		live = true
		cursor = Double(head)
		held = false
		rate = 1
		coasting = false
		boundaryStep = 0
		if resetControls {
			pitch.store(0, ordering: .sequentiallyConsistent)
			quartzLocked.store(true, ordering: .sequentiallyConsistent)
			bufferLimit.store(0, ordering: .sequentiallyConsistent)
		}
		fade = 128
		fadeFrom.update(from: last, count: Self.maxChannels)
	}

	private func boundedRate(_ value: Double) -> Double {
		value.isFinite ? min(4, max(-4, value)) : 0
	}
}
