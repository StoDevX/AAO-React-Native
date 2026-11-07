import Foundation

@main
struct AudioVisualizationTests {
	static func tone(
		_ frequency: Double, rate: Double = 48000, amplitude: Float = 0.5,
		inverted: Bool = false, frames: Int = 48000
	) -> VisualizationAnalysis {
		let analysis = VisualizationAnalysis(sampleRate: rate)
		for i in 0..<frames {
			let value = amplitude * Float(sin(2 * Double.pi * frequency * Double(i) / rate))
			analysis.append(value, inverted ? -value : value)
		}
		analysis.spectrum(elapsed: 1)
		return analysis
	}

	static func main() {
		let silence = tone(440, amplitude: 0)
		precondition(silence.bands.allSatisfy { $0 == 0 }, "Silence must have no spectral energy")
		precondition(silence.waveform().allSatisfy { $0 == 0 })
		for rate in [44100.0, 48000, 96000] {
			let analysis = tone(1000, rate: rate, frames: Int(rate))
			let peak = analysis.bands.enumerated().max { $0.element < $1.element }!.offset
			precondition(
				(17...19).contains(peak),
				"A 1 kHz tone belongs in its logarithmic band at every sample rate")
			precondition(
				analysis.columns == 120,
				"The waveform timeline must use seconds, not the input sample rate")
		}
		let normal = tone(1000)
		let inverted = tone(1000, inverted: true)
		precondition(
			zip(normal.bands, inverted.bands).allSatisfy { abs($0 - $1) < 0.00001 },
			"Opposite-phase stereo must not cancel the spectrum")
		precondition(
			normal.waveform() == inverted.waveform(),
			"The envelope must preserve opposite-phase stereo")
		let quiet = tone(1000, amplitude: 0.05)
		precondition(
			quiet.bands.max()! < normal.bands.max()! - 0.2,
			"Fixed scaling must preserve amplitude differences")

		let queue = VisualizationSamples()
		precondition(!queue.beginBlock(1), "Hidden visualizers must not capture")
		queue.enabled.store(true, ordering: .releasing)
		for cycle in 0..<4 {
			precondition(queue.beginBlock(VisualizationSamples.capacity + 10))
			for i in 0..<(VisualizationSamples.capacity + 10) {
				queue.append(Float(i + cycle), -Float(i + cycle))
			}
			queue.endBlock()
			var index = 0
			let count = queue.drain { l, r in
				precondition(
					l == Float(index + cycle) && r == -l,
					"Overflow must preserve the unread stereo samples")
				index += 1
			}
			precondition(count == VisualizationSamples.capacity)
		}
		for count in [17, 23, 800, 1] {
			precondition(queue.beginBlock(count))
			for _ in 0..<count { queue.append(0.25, -0.25) }
			queue.endBlock()
			precondition(queue.drain { l, r in precondition(l == 0.25 && r == -0.25) } == count)
		}
		precondition(queue.beginBlock(1))
		queue.append(.nan, .infinity)
		queue.endBlock()
		queue.drain { l, r in
			precondition(l == 0 && r == 0, "Invalid samples must not poison analysis")
		}

		var transition = VisualizationTransition()
		transition.retarget([1], at: 0, duration: 0.1)
		precondition(abs(transition.value(at: 0.05, index: 0) - 0.5) < 0.00001)
		transition.retarget([0], at: 0.05, duration: 0.1)
		precondition(
			abs(transition.value(at: 0.05, index: 0) - 0.5) < 0.00001, "Retargeting must not jump"
		)
		precondition(abs(transition.value(at: 0.1, index: 0) - 0.25) < 0.00001)
		precondition(
			transition.value(at: 10, index: 0) == 0,
			"Interpolation must settle without extrapolating")
		for fps in [30, 60, 120] {
			var animation = VisualizationTransition()
			animation.retarget([1], at: 0, duration: 1)
			for frame in 0...fps {
				_ = animation.value(at: Double(frame) / Double(fps), index: 0)
			}
			precondition(
				animation.value(at: 0.5, index: 0) == 0.5,
				"Interpolation must depend on time, not frame count")
		}
		var demand = VisualizationDemand()
		let waveformID = UUID()
		let spectrumID = UUID()
		demand.subscribe(waveformID, mode: .waveform)
		let requested = VisualizationAnalysis(sampleRate: 48000)
		for i in 0..<48000 {
			let value = Float(sin(2 * Double.pi * 1000 * Double(i) / 48000)) * 0.5
			requested.append(value, -value)
		}
		let waveform = requested.snapshot(demand, elapsed: 1)
		precondition(waveform.bands.isEmpty && !waveform.waveform.isEmpty)
		precondition(
			requested.bands.allSatisfy { $0 == 0 },
			"Waveform-only demand must leave spectral analysis untouched")
		demand.subscribe(spectrumID, mode: .spectrum)
		let both = requested.snapshot(demand, elapsed: 1)
		precondition(
			both.bands.max()! > 0 && both.waveform == waveform.waveform,
			"A spectrum subscriber must use the warm sample window without interrupting waveform history"
		)
		demand.unsubscribe(spectrumID)
		let heldBands = requested.bands
		for _ in 0..<48000 { requested.append(0, 0) }
		_ = requested.snapshot(demand, elapsed: 1)
		precondition(
			requested.bands == heldBands,
			"Removing the last spectrum subscriber must stop FFT updates")
		demand.subscribe(waveformID, mode: .spectrum)
		precondition(
			!demand.waveform && demand.spectrum,
			"Changing modes must replace the subscriber's demand")
		precondition(requested.snapshot(demand, elapsed: 1).waveform.isEmpty)
		demand.unsubscribe(waveformID)
		precondition(demand.isEmpty)

		for fps in [30, 60, 120] {
			var position = VisualizationPosition()
			position.retarget(120, at: 0, duration: 1)
			for frame in 0...fps { _ = position.value(at: Double(frame) / Double(fps)) }
			precondition(position.value(at: 0.5) == 60)
			position.retarget(0, at: 0.5, duration: 1)
			precondition(position.value(at: 0.5) == 60 && position.value(at: 1) == 30)
			precondition(position.value(at: 2) == 0 && !position.isAnimating(at: 2))
		}
		precondition(!transition.isAnimating(at: 10))

		print("Spectrum, stereo envelope, sample queue and elapsed-time interpolation passed")
	}
}
