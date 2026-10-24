import AVFoundation
import Synchronization

/// Owns the audio-unit chain. Settings use a lock; all parameter ramps run on
/// the main queue, independently of the source node's real-time render callback.
final class RadioEffects {
	let filter = AVAudioUnitEQ(numberOfBands: 2)
	let echo = AVAudioUnitDelay()
	let reverb = AVAudioUnitReverb()
	private let lock = NSLock()
	private let channels = Effect.allCases.map { _ in Channel() }
	private var loadedPreset = 1
	private var loadedOccupancy = 0.0

	private enum Effect: String, CaseIterable {
		case filter, echo, reverb
		var index: Int { Self.allCases.firstIndex(of: self)! }
	}

	private final class Channel {
		var setting = EffectSetting()
		let generation = Atomic<UInt64>(0)
	}

	init() {
		filter.bands[0].filterType = .resonantLowPass
		filter.bands[0].frequency = 20000
		filter.bands[1].filterType = .resonantHighPass
		filter.bands[1].frequency = 20
		for band in filter.bands {
			band.bypass = true
			band.bandwidth = 2
		}
		echo.delayTime = 0.25
		echo.feedback = 25
		echo.wetDryMix = 0
		reverb.loadFactoryPreset(.mediumHall)
		reverb.wetDryMix = 0
	}

	var customRoomsAvailable: Bool {
		reverb.audioComponentDescription.componentSubType == kAudioUnitSubType_Reverb2
	}

	var status: [String: [String: Any]] {
		lock.withLock {
			Dictionary(
				uniqueKeysWithValues: Effect.allCases.map {
					($0.rawValue, channels[$0.index].setting.status)
				})
		}
	}

	func connect(_ engine: AVAudioEngine, source: AVAudioSourceNode, format: AVAudioFormat) throws {
		for node in [source, filter, echo, reverb] as [AVAudioNode] { engine.attach(node) }
		try engine.connectNode(source, to: filter, format: format)
		try engine.connectNode(filter, to: echo, format: format)
		try engine.connectNode(echo, to: reverb, format: format)
		try engine.connectNode(reverb, to: engine.mainMixerNode, format: format)
	}

	func cancelRamps() {
		lock.withLock {
			for channel in channels { channel.generation.wrappingAdd(1, ordering: .relaxed) }
		}
	}

	func setEffect(_ name: String, enabled: Bool, amount: Double) {
		guard let effect = Effect(rawValue: name) else { return }
		lock.withLock {
			let channel = channels[effect.index]
			if effect == .filter && enabled && !channel.setting.enabled {
				channel.setting.setLowCut(0)
			}
			channel.setting.set(enabled, amount)
			scheduleRamp(effect, channel)
		}
	}

	func setParameter(_ name: String, parameter: String, value: Double) {
		guard let effect = Effect(rawValue: name) else { return }
		lock.withLock {
			let channel = channels[effect.index]
			switch (effect, parameter) {
			case (.filter, "lowCut"): channel.setting.setLowCut(value)
			case (.filter, "highCut"): channel.setting.set(channel.setting.enabled, value)
			case (.filter, "resonance"): channel.setting.setResonance(value)
			case (.echo, "delayMs"): channel.setting.setDelay(value)
			case (.echo, "feedback"): channel.setting.setFeedback(value)
			case (.reverb, "occupancy"): channel.setting.setOccupancy(value)
			case (.reverb, "preset"):
				if value.isFinite && value >= 2.5 && !customRoomsAvailable { return }
				channel.setting.setPreset(value)
			default: return
			}
			scheduleRamp(effect, channel)
		}
	}

	/// Each edit invalidates pending steps, which then start from the units' current values.
	private func scheduleRamp(_ effect: Effect, _ channel: Channel) {
		let setting = channel.setting
		let generation = channel.generation.wrappingAdd(1, ordering: .relaxed).newValue
		DispatchQueue.main.async { [weak self] in
			guard let self, channel.generation.load(ordering: .relaxed) == generation else {
				return
			}
			switch effect {
			case .filter: self.rampFilter(setting, channel, generation)
			case .echo: self.rampEcho(setting, channel, generation)
			case .reverb: self.rampReverb(setting, channel, generation)
			}
		}
	}

	private func steps(
		_ count: Int, _ channel: Channel, _ generation: UInt64, _ apply: @escaping (Int) -> Void
	) {
		for step in 1...count {
			DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(step * 5)) {
				guard channel.generation.load(ordering: .relaxed) == generation else {
					return
				}
				apply(step)
			}
		}
	}

	private func rampFilter(_ setting: EffectSetting, _ channel: Channel, _ generation: UInt64) {
		let high = filter.bands[0]
		let low = filter.bands[1]
		if high.bypass { high.frequency = 20000 }
		if low.bypass { low.frequency = 20 }
		let startHigh = Double(high.frequency)
		let startLow = Double(low.frequency)
		let startHighBandwidth = Double(high.bandwidth)
		let startLowBandwidth = Double(low.bandwidth)
		if setting.highCutActive() { high.bypass = false }
		if setting.lowCutActive() { low.bypass = false }
		steps(10, channel, generation) { step in
			let progress = Double(step) / 10
			high.frequency = Float(startHigh * pow(setting.cutoff() / startHigh, progress))
			low.frequency = Float(startLow * pow(setting.lowCutFrequency() / startLow, progress))
			high.bandwidth = Float(
				startHighBandwidth + (setting.bandwidth() - startHighBandwidth) * progress)
			low.bandwidth = Float(
				startLowBandwidth + (setting.bandwidth() - startLowBandwidth) * progress)
			if step == 10 {
				high.bypass = !setting.highCutActive()
				low.bypass = !setting.lowCutActive()
			}
		}
	}

	private func rampEcho(_ setting: EffectSetting, _ channel: Channel, _ generation: UInt64) {
		let startMix = Double(echo.wetDryMix)
		let startDelay = echo.delayTime
		let startFeedback = Double(echo.feedback)
		steps(10, channel, generation) { [echo] step in
			let progress = Double(step) / 10
			echo.delayTime = startDelay + (setting.delayMs / 1000 - startDelay) * progress
			echo.feedback = Float(startFeedback + (setting.feedback - startFeedback) * progress)
			echo.wetDryMix = Float(startMix + (setting.wet(40) - startMix) * progress)
		}
	}

	private func rampReverb(_ setting: EffectSetting, _ channel: Channel, _ generation: UInt64) {
		let start = Double(reverb.wetDryMix)
		let changingPreset =
			loadedPreset != setting.preset
			|| (setting.preset >= 3 && loadedOccupancy != setting.occupancy)
		steps(changingPreset ? 20 : 10, channel, generation) { [weak self] step in
			guard let self else { return }
			let progress = Double(step) / 10
			if changingPreset {
				if step <= 10 { self.setReverbMix(start * (1 - progress)) }
				if step == 10 {
					self.loadRoom(setting)
					self.setReverbMix(0)
					self.loadedPreset = setting.preset
					self.loadedOccupancy = setting.occupancy
				}
				if step > 10 { self.setReverbMix(setting.wet(50) * Double(step - 10) / 10) }
			} else {
				self.setReverbMix(start + (setting.wet(50) - start) * progress)
			}
		}
	}

	/// The EQ supplies equal-power makeup for iOS reverb's linear crossfade.
	private func setReverbMix(_ mix: Double) {
		reverb.wetDryMix = Float(mix)
		filter.globalGain = Float(EffectSetting.reverbMakeupDb(mix))
	}

	private func loadRoom(_ setting: EffectSetting) {
		let presets: [AVAudioUnitReverbPreset] = [.smallRoom, .mediumHall, .largeHall]
		reverb.loadFactoryPreset(presets[min(setting.preset, 2)])
		guard setting.preset >= 3 else { return }
		// Dimensions guide reflection spacing; clap tails and absorption guide decay.
		let room = setting.roomAcoustics()
		let parameters: [(AudioUnitParameterID, Double)] = [
			(kReverb2Param_MinDelayTime, room.minDelay),
			(kReverb2Param_MaxDelayTime, room.maxDelay),
			(kReverb2Param_DecayTimeAt0Hz, room.decayLow),
			(kReverb2Param_DecayTimeAtNyquist, room.decayHigh),
		]
		for (id, value) in parameters {
			let result = reverb.withAudioUnit {
				AudioUnitSetParameter($0, id, kAudioUnitScope_Global, 0, Float(value), 0)
			}
			if result != noErr { NSLog("RadioScrub room parameter: %d", result) }
		}
	}
}
