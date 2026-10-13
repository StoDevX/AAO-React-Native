import Accelerate
import Foundation
import Synchronization

/// One audio producer and one analysis consumer; the producer never waits for analysis.
final class VisualizationSamples: @unchecked Sendable {
	static let capacity = 32768
	private let samples = UnsafeMutablePointer<Float>.allocate(capacity: capacity * 2)
	private let written = Atomic<Int>(0)
	private let read = Atomic<Int>(0)
	let enabled = Atomic<Bool>(false)
	let sampleRate = Atomic<Double>(48000)
	let revision = Atomic<UInt64>(0)
	private var head = 0
	private var remaining = 0

	init() { samples.initialize(repeating: 0, count: Self.capacity * 2) }
	deinit { samples.deallocate() }

	/// Called by the transport before processing a new audio format.
	func prepare(_ rate: Double) {
		sampleRate.store(rate, ordering: .releasing)
		revision.wrappingAdd(1, ordering: .releasing)
	}

	func beginBlock(_ frames: Int) -> Bool {
		guard enabled.load(ordering: .acquiring) else { return false }
		head = written.load(ordering: .relaxed)
		remaining = min(frames, Self.capacity - (head - read.load(ordering: .acquiring)))
		return true
	}

	func append(_ left: Float, _ right: Float) {
		guard remaining > 0 else { return }
		let slot = (head % Self.capacity) * 2
		samples[slot] = left.isFinite ? left : 0
		samples[slot + 1] = right.isFinite ? right : 0
		head += 1
		remaining -= 1
	}

	func endBlock() { written.store(head, ordering: .releasing) }

	@discardableResult
	func drain(_ consume: (Float, Float) -> Void) -> Int {
		var tail = read.load(ordering: .relaxed)
		let end = written.load(ordering: .acquiring)
		let count = end - tail
		while tail < end {
			let slot = (tail % Self.capacity) * 2
			consume(samples[slot], samples[slot + 1])
			tail += 1
		}
		read.store(tail, ordering: .releasing)
		return count
	}
}

/// A rolling stereo analyzer. Only the analysis queue touches its mutable storage.
final class VisualizationAnalysis {
	static let fftSize = 2048
	static let bandCount = 32
	static let waveformRate = 120.0
	static let historyCount = 480
	private let setup = vDSP_create_fftsetup(11, FFTRadix(kFFTRadix2))!
	private let window = vDSP.window(ofType: Float.self, usingSequence: .hanningDenormalized, count: fftSize, isHalfWindow: false)
	private var left = [Float](repeating: 0, count: fftSize)
	private var right = [Float](repeating: 0, count: fftSize)
	private var real = [Float](repeating: 0, count: fftSize)
	private var imaginary = [Float](repeating: 0, count: fftSize)
	private var power = [Float](repeating: 0, count: fftSize / 2)
	private var cursor = 0
	private var frames = 0
	private var bucketFrames = 0.0
	private var peak: Float = 0
	private var envelope = [Float](repeating: 0, count: historyCount)
	private(set) var columns = 0
	private(set) var bands = [Float](repeating: 0, count: bandCount)
	let sampleRate: Double

	init(sampleRate: Double) { self.sampleRate = sampleRate }
	deinit { vDSP_destroy_fftsetup(setup) }

	func append(_ l: Float, _ r: Float) {
		left[cursor] = l
		right[cursor] = r
		cursor = (cursor + 1) % Self.fftSize
		frames += 1
		peak = max(peak, abs(l), abs(r))
		bucketFrames += 1
		if bucketFrames >= sampleRate / Self.waveformRate {
			envelope[columns % Self.historyCount] = min(1, peak)
			columns += 1
			bucketFrames -= sampleRate / Self.waveformRate
			peak = 0
		}
	}

	func spectrum(elapsed: Double) {
		guard frames >= Self.fftSize else { return }
		power.withUnsafeMutableBufferPointer { $0.initialize(repeating: 0) }
		transform(left)
		transform(right)
		let nyquist = min(20000, sampleRate / 2)
		for band in 0..<Self.bandCount {
			let low = 20 * pow(nyquist / 20, Double(band) / Double(Self.bandCount))
			let high = 20 * pow(nyquist / 20, Double(band + 1) / Double(Self.bandCount))
			let start = max(1, min(Self.fftSize / 2 - 1, Int(low * Double(Self.fftSize) / sampleRate)))
			let end = max(start + 1, min(Self.fftSize / 2, Int(ceil(high * Double(Self.fftSize) / sampleRate))))
			let magnitude = sqrt(power[start..<end].max() ?? 0)
			let db = 20 * log10(max(magnitude, 0.00001))
			let target = min(1, max(0, (db + 72) / 72))
			let coefficient = Float(1 - exp(-elapsed / (target > bands[band] ? 0.025 : 0.18)))
			bands[band] += (target - bands[band]) * coefficient
		}
	}

	private func transform(_ samples: [Float]) {
		for i in 0..<Self.fftSize {
			real[i] = samples[(cursor + i) % Self.fftSize] * window[i]
			imaginary[i] = 0
		}
		real.withUnsafeMutableBufferPointer { re in
			imaginary.withUnsafeMutableBufferPointer { im in
				var split = DSPSplitComplex(realp: re.baseAddress!, imagp: im.baseAddress!)
				vDSP_fft_zip(setup, &split, 1, 11, FFTDirection(kFFTDirection_Forward))
				let scale = Float(2) / Float(Self.fftSize * Self.fftSize)
				for i in power.indices { power[i] += (re[i] * re[i] + im[i] * im[i]) * scale }
			}
		}
	}

	func waveform() -> [Float] {
		(0..<Self.historyCount).map { i in
			let column = columns - Self.historyCount + i
			return column < 0 ? 0 : envelope[column % Self.historyCount]
		}
	}
}

/// Elapsed-time interpolation retargets from the visible value instead of jumping.
struct VisualizationTransition {
	private var start: [Float] = []
	private var target: [Float] = []
	private var began = 0.0
	private var duration = 1.0 / 30

	mutating func retarget(_ values: [Float], at time: Double, duration: Double) {
		start = target.isEmpty ? [Float](repeating: 0, count: values.count) : value(at: time)
		target = values
		began = time
		self.duration = max(1.0 / 120, duration)
	}

	func value(at time: Double) -> [Float] {
		let progress = Float(min(1, max(0, (time - began) / duration)))
		return zip(start, target).map { $0 + ($1 - $0) * progress }
	}
}

struct VisualizationFrame {
	var sequence: UInt64 = 0
	var revision: UInt64 = 0
	var time: Double = 0
	var bands = [Float](repeating: 0, count: VisualizationAnalysis.bandCount)
	var waveform = [Float](repeating: 0, count: VisualizationAnalysis.historyCount)
	var columns = 0
}

/// Capture is allocation-free; subscribers share one worker and immutable display frames.
final class AudioVisualization: @unchecked Sendable {
	let samples = VisualizationSamples()
	private let queue = DispatchQueue(label: "radio.visualization", qos: .utility)
	private let lock = NSLock()
	private var latest = VisualizationFrame()
	private var subscribers = Set<UUID>()
	private var timer: DispatchSourceTimer?
	private var analysis = VisualizationAnalysis(sampleRate: 48000)
	private var revision: UInt64 = 0
	private var sequence: UInt64 = 0
	private var epoch: UInt64 = 0
	private var lastAudio = 0.0
	private var lastUpdate = 0.0

	func frame() -> VisualizationFrame { lock.withLock { latest } }

	func subscribe(_ id: UUID) {
		queue.async { [self] in
			subscribers.insert(id)
			guard timer == nil else { return }
			reset()
			samples.enabled.store(true, ordering: .releasing)
			let timer = DispatchSource.makeTimerSource(queue: queue)
			timer.schedule(deadline: .now(), repeating: 1.0 / 30)
			timer.setEventHandler { [weak self] in self?.update() }
			self.timer = timer
			timer.resume()
		}
	}

	func unsubscribe(_ id: UUID) {
		queue.async { [self] in
			subscribers.remove(id)
			guard subscribers.isEmpty else { return }
			samples.enabled.store(false, ordering: .releasing)
			timer?.cancel()
			timer = nil
			reset()
		}
	}

	private func reset() {
		samples.drain { _, _ in }
		revision = samples.revision.load(ordering: .acquiring)
		analysis = VisualizationAnalysis(sampleRate: samples.sampleRate.load(ordering: .acquiring))
		lastAudio = 0
		lastUpdate = 0
		sequence &+= 1
		epoch &+= 1
		lock.withLock { latest = VisualizationFrame(sequence: sequence, revision: epoch) }
	}

	private func update() {
		if revision != samples.revision.load(ordering: .acquiring) { reset() }
		let now = ProcessInfo.processInfo.systemUptime
		let count = samples.drain { [self] l, r in analysis.append(l, r) }
		guard count > 0 else {
			if lastAudio > 0 && now - lastAudio > 0.25 { reset() }
			return
		}
		analysis.spectrum(elapsed: lastUpdate == 0 ? 1.0 / 30 : min(0.2, now - lastUpdate))
		lastAudio = now
		lastUpdate = now
		sequence &+= 1
		let frame = VisualizationFrame(sequence: sequence, revision: epoch, time: now,
			bands: analysis.bands, waveform: analysis.waveform(), columns: analysis.columns)
		lock.withLock { latest = frame }
	}
}
