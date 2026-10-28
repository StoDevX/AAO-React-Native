import Foundation

private func require(_ condition: Bool, _ message: String) throws {
	if !condition { throw TestFailure.failed(message) }
}
private enum TestFailure: Error { case failed(String) }

@discardableResult
private func feed(_ buffer: RecordBuffer, _ start: Int, _ count: Int) -> [Float] {
	var output: [Float] = []
	buffer.beginBlock()
	for frame in start..<(start + count) {
		var input: (Float, Float) = (Float(frame) / 100000, -Float(frame) / 100000)
		var result: (Float, Float) = (0, 0)
		withUnsafePointer(to: &input) { input in
			withUnsafeMutablePointer(to: &result) { result in
				input.withMemoryRebound(to: Float.self, capacity: 2) { input in
					result.withMemoryRebound(to: Float.self, capacity: 2) { result in
						buffer.processFrame(input, result)
					}
				}
			}
		}
		precondition(result.0.isFinite && result.1.isFinite, "Output must stay finite")
		precondition(abs(result.0 + result.1) < 0.000001, "Stereo channels must remain paired")
		output.append(result.0)
	}
	buffer.endBlock()
	return output
}

@main
struct RecordBufferTests {
	static func main() throws {
		try testScratchAndPitch()
		try testFilter()
		try testPlaybackGate()
		try testEffects()
		print(
			"Scratch, pitch, history boundaries, playback cushion, filters and room acoustics passed"
		)
	}

	private static func testScratchAndPitch() throws {
		let buffer = RecordBuffer()
		buffer.prepare(1000, 2)
		let live = feed(buffer, 0, 10000)
		try require(
			live.first! == 0 && live.last! == 9999 / Float(100000),
			"Live audio must pass through unchanged")
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0,
			"Live audio must have no added delay")

		buffer.begin()
		buffer.move(-1)
		var reverse = feed(buffer, 10000, 100)
		try require(
			reverse[99] < reverse[50] && reverse[50] < reverse[20],
			"A negative rate must read actual older samples in reverse")
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) > 0.15,
			"Scratching backward must create a delay")

		buffer.release(1)
		var delay = buffer.delaySeconds.load(ordering: .sequentiallyConsistent)
		let forward = feed(buffer, 10100, 2000)
		try require(
			forward.last! > forward.first!, "Release at normal speed must resume forward audio")
		try require(
			abs(buffer.delaySeconds.load(ordering: .sequentiallyConsistent) - delay) < 0.002,
			"Normal speed must preserve the scratched position behind live")

		buffer.begin()
		buffer.move(0)
		let held = feed(buffer, 12100, 200)
		try require(
			abs(held.last!) < 0.00001,
			"A held record must become silent rather than emit a DC tone")
		buffer.release(-2)
		let coast = feed(buffer, 12300, 2000)
		try require(coast[1900] > coast[1800], "A backspin must settle back into forward playback")

		buffer.goLive()
		let returned = feed(buffer, 14300, 256)
		try require(
			returned.last! == 14555 / Float(100000),
			"Go Live must return to incoming audio after its fade")
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0,
			"Go Live must clear the delay")

		_ = feed(buffer, 14556, 40000)
		try require(
			buffer.availableSeconds.load(ordering: .sequentiallyConsistent) == 30,
			"History must stay bounded at thirty seconds")
		buffer.begin()
		buffer.move(-4)
		let exhausted = feed(buffer, 54556, 12000)
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) <= 30,
			"Scrubbing must not escape the history window")
		try require(
			abs(exhausted.last!) < 0.00001,
			"Exhausted history must be silent rather than wrap to unrelated audio")
		buffer.release(1)
		let resumed = feed(buffer, 66556, 1000)
		try require(resumed.last! > 0, "Playback must recover from the oldest history boundary")

		buffer.prepare(1000, 2)
		try require(
			buffer.availableSeconds.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0,
			"A replacement stream must discard old audio and delay")
		buffer.begin()
		buffer.move(Double.nan)
		let empty = feed(buffer, 0, 100)
		try require(
			abs(empty.last!) < 0.000001, "Invalid rates and empty history must not emit noise")
		// Start well inside the history so speed tests are independent of edge protection.
		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 20000)
		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 20000, 5000)
		buffer.release(1)
		_ = feed(buffer, 25000, 2000)
		buffer.setPitch(8)
		_ = feed(buffer, 27000, 2000)
		delay = buffer.delaySeconds.load(ordering: .sequentiallyConsistent)
		_ = feed(buffer, 29000, 1000)
		try require(
			abs(buffer.delaySeconds.load(ordering: .sequentiallyConsistent) - delay + 0.08)
				< 0.002, "+8 percent must advance playback at 1.08x")
		try require(
			!buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Moving pitch must unlock quartz")
		buffer.setPitch(-8)
		_ = feed(buffer, 30000, 2000)
		delay = buffer.delaySeconds.load(ordering: .sequentiallyConsistent)
		_ = feed(buffer, 32000, 1000)
		try require(
			abs(buffer.delaySeconds.load(ordering: .sequentiallyConsistent) - delay - 0.08)
				< 0.002, "-8 percent must play at 0.92x")
		buffer.begin()
		buffer.move(-1)
		reverse = feed(buffer, 33000, 100)
		try require(
			reverse.last! < reverse[50],
			"Scratch must override the selected positive playback rate")
		buffer.release(-2)
		_ = feed(buffer, 33100, 4000)
		delay = buffer.delaySeconds.load(ordering: .sequentiallyConsistent)
		_ = feed(buffer, 37100, 1000)
		try require(
			abs(buffer.delaySeconds.load(ordering: .sequentiallyConsistent) - delay - 0.08)
				< 0.002, "Scratch release must coast back to the selected pitch")
		buffer.setQuartzLocked(true)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Quartz lock must center pitch exactly")
		_ = feed(buffer, 38100, 2000)
		delay = buffer.delaySeconds.load(ordering: .sequentiallyConsistent)
		_ = feed(buffer, 40100, 1000)
		try require(
			abs(buffer.delaySeconds.load(ordering: .sequentiallyConsistent) - delay) < 0.002,
			"Quartz must preserve delay at exactly 1x")

		buffer.goLive()
		_ = feed(buffer, 41100, 100)
		buffer.setPitch(8)
		_ = feed(buffer, 41200, 100)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& !buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Positive pitch at live must center without locking")
		try require(
			buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 1,
			"Live correction must report its reason")
		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 41300, 4000)
		buffer.release(1)
		_ = feed(buffer, 45300, 2000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0,
			"Moving away from the boundary must never restore corrected pitch")

		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 1000)
		buffer.setPitch(-8)
		_ = feed(buffer, 1000, 1)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) > -2.68
				&& buffer.pitch.load(ordering: .sequentiallyConsistent) < -2.65,
			"A partial buffer must cap pitch by distance to its actual oldest sample")
		buffer.begin()
		buffer.move(-4)
		_ = feed(buffer, 1001, 1000)
		buffer.release(1)
		_ = feed(buffer, 2001, 1)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 2,
			"Oldest partial-buffer edge must center negative pitch")
		try require(
			!buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Oldest correction must leave quartz unlocked")
		_ = feed(buffer, 2002, 4000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0,
			"Oldest correction must stay centered as history grows")

		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 40000)
		buffer.begin()
		buffer.move(-4)
		_ = feed(buffer, 40000, 10000)
		buffer.setPitch(-8)
		buffer.release(1)
		_ = feed(buffer, 50000, 1)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 2,
			"Full-buffer oldest edge must center negative pitch")
		buffer.setPitch(-8)
		buffer.goLive()
		_ = feed(buffer, 50001, 200)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Go Live must center and lock")
		buffer.setPitch(Double.nan)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0,
			"Non-finite pitch must normalize to center")
		buffer.setPitch(100)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 8,
			"Pitch must be bounded at eight percent")
		buffer.prepare(1000, 2)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.quartzLocked.load(ordering: .sequentiallyConsistent)
				&& buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 0,
			"Station replacement must reset pitch, lock, and boundary reason")

		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 20000)
		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 20000, 2900)
		buffer.release(1)
		_ = feed(buffer, 22900, 2000)
		buffer.setPitch(8)
		_ = feed(buffer, 24900, 1000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) > 0
				&& buffer.pitch.load(ordering: .sequentiallyConsistent) < 8,
			"Live-edge correction must approach center gradually")
		_ = feed(buffer, 25900, 4000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0,
			"Live-edge correction must finish within five seconds")
		_ = feed(buffer, 29900, 5000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& !buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Finished correction must stay centered and unlocked")
		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 1000)
		buffer.setPitch(-8)
		_ = feed(buffer, 1000, 5000)
		try require(
			buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 2,
			"Oldest-edge correction must finish within five seconds even as a partial buffer grows"
		)

		buffer.prepare(1000, 2)
		_ = feed(buffer, 0, 10000)
		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 10000, 400)
		buffer.setPitch(-8)
		buffer.release(4)
		let thrownLive = feed(buffer, 10400, 2000)
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"A forward throw reaching live must center pitch and enable quartz like Go Live")
		try require(
			buffer.bufferLimit.load(ordering: .sequentiallyConsistent) == 0,
			"A forward return to live must clear the boundary reason")
		try require(
			thrownLive.last! == 12399 / Float(100000),
			"A forward return must settle into dry incoming samples after the Go Live fade")
		_ = feed(buffer, 12400, 1000)
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0,
			"A completed forward throw must not drift away at the old negative pitch")

		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 13400, 2000)
		buffer.setPitch(-8)
		buffer.move(4)
		_ = feed(buffer, 15400, 1000)
		try require(
			!buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"A held scratch must retain manual control at the live edge")
		buffer.release(1)
		_ = feed(buffer, 16400, 500)
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.pitch.load(ordering: .sequentiallyConsistent) == 0
				&& buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"Releasing a forward scratch at live must also perform Go Live")

		buffer.begin()
		buffer.move(0)
		_ = feed(buffer, 16900, 2000)
		buffer.setPitch(-8)
		buffer.release(2)
		_ = feed(buffer, 18900, 2000)
		try require(
			buffer.delaySeconds.load(ordering: .sequentiallyConsistent) > 1
				&& buffer.pitch.load(ordering: .sequentiallyConsistent) == -8
				&& !buffer.quartzLocked.load(ordering: .sequentiallyConsistent),
			"A throw that does not reach live must preserve the selected pitch")

	}

	private static func testFilter() throws {
		var filter = EffectSetting()
		filter.set(true, 0)
		try require(
			!filter.highCutActive() && !filter.lowCutActive(),
			"Enabling a neutral filter must leave both bands bypassed")
		filter.setLowCut(1)
		try require(
			filter.lowCutActive() && !filter.highCutActive() && filter.lowCutFrequency() == 4000,
			"Low-cut must operate independently of high-cut")
		filter.set(true, 1)
		try require(
			filter.lowCutActive() && filter.highCutActive() && filter.cutoff() == 250,
			"Both filter bands must stack")
		filter.set(false, 1)
		try require(
			!filter.lowCutActive() && !filter.highCutActive() && filter.lowCut == 1,
			"Disabling must bypass both bands and retain their settings")
		filter.setLowCut(Double.nan)
		try require(
			filter.lowCut == 0 && filter.lowCutFrequency() == 20,
			"Non-finite low-cut must normalize to its neutral endpoint")
		filter.setLowCut(-1)
		try require(filter.lowCut == 0, "Low-cut must reject negative amounts")
		filter.setLowCut(2)
		try require(filter.lowCut == 1, "Low-cut must remain within its supported frequency range")

	}

	private static func testPlaybackGate() throws {
		var gate = PlaybackGate(750)
		try require(
			!gate.canRender(100, 100),
			"Startup must wait for a network cushion rather than play the first burst")
		try require(!gate.canRender(749, 100), "A partial startup cushion must remain silent")
		try require(gate.canRender(750, 100), "A full startup cushion must start playback")
		try require(
			gate.canRender(100, 100), "Primed playback may consume below the startup threshold")
		try require(
			!gate.canRender(99, 100),
			"Underflow must stop at a block boundary instead of fragmenting audio")
		try require(
			!gate.canRender(300, 100),
			"Recovery must wait for a fresh cushion instead of stuttering through bursts")
		try require(gate.canRender(750, 100), "A recovered queue must resume")
		var largeBlock = PlaybackGate(750)
		try require(
			!largeBlock.canRender(750, 1000) && largeBlock.canRender(1000, 1000),
			"The gate must require enough for the actual render block")

	}

	private static func testEffects() throws {
		var effect = EffectSetting()
		for percent in [0.0, 10.0, 25.0, 50.0, 75.0, 100.0] {
			let gain = pow(10, EffectSetting.reverbMakeupDb(percent) / 20)
			let dry = gain * (1 - percent / 100)
			let wet = gain * percent / 100
			try require(
				abs(dry * dry + wet * wet - 1) < 1e-9,
				"Reverb's crossfade must preserve equal-power signal energy")
		}
		try require(
			EffectSetting.reverbMakeupDb(0) == 0 && EffectSetting.reverbMakeupDb(Double.nan) == 0,
			"Dry or invalid reverb mixes must add no gain")
		try require(
			!effect.enabled && effect.amount == 0,
			"Effects must start disabled with a neutral amount")
		effect.set(true, 1.5)
		try require(
			effect.amount == 1 && effect.cutoff() == 250 && effect.wet(40) == 40,
			"Effect normalization must cap amounts and map their presets")
		effect.set(false, effect.amount)
		try require(
			effect.amount == 1 && effect.cutoff() == 20000 && effect.wet(50) == 0,
			"Disabling must retain amount and return parameters to dry")
		effect.set(true, -1)
		try require(
			effect.amount == 0 && effect.cutoff() == 20000,
			"Negative amounts must normalize to zero")
		effect.set(true, Double.nan)
		try require(
			effect.amount == 0 && effect.cutoff() == 20000,
			"Non-finite amounts must normalize to dry audio")
		effect.set(true, 0.5)
		try require(
			abs(effect.cutoff() - sqrt(20000.0 * 250)) < 0.01,
			"Filter midpoint must map logarithmically")
		effect.setDelay(2000)
		effect.setFeedback(100)
		effect.setResonance(-10)
		effect.setPreset(8)
		try require(
			effect.delayMs == 1000 && effect.feedback == 75 && effect.resonance == 0
				&& effect.preset == 8,
			"Extra parameters must stay within their supported ranges")
		effect.setDelay(Double.nan)
		effect.setFeedback(Double.nan)
		effect.setResonance(Double.nan)
		effect.setPreset(Double.nan)
		try require(
			effect.delayMs == 250 && effect.feedback == 25 && effect.resonance == 0
				&& effect.preset == 1, "Non-finite parameters must use safe defaults")
		effect.set(true, 0)
		try require(
			!effect.active() && effect.wet(50) == 0 && effect.cutoff() == 20000,
			"An enabled effect at zero must remain neutral")
		effect.set(true, 0.5)
		effect.setResonance(100)
		try require(
			effect.active() && abs(effect.bandwidth() - 0.1) < 0.001,
			"Resonance must narrow the resonant low-pass bandwidth")
		effect.setPreset(3)
		let emptyRoom = effect.roomAcoustics()
		effect.setOccupancy(1)
		let fullRoom = effect.roomAcoustics()
		try require(
			abs(fullRoom.decayLow / emptyRoom.decayLow - 2.0 / 3) < 0.001
				&& abs(fullRoom.decayHigh / emptyRoom.decayHigh - 2.0 / 3) < 0.001,
			"A full audience must shorten both chapel decay bands by a third")
		try require(
			fullRoom.minDelay == emptyRoom.minDelay && fullRoom.maxDelay == emptyRoom.maxDelay,
			"Audience absorption must not change room dimensions")
		for room in [7.0, 8.0] {
			effect.setPreset(room)
			effect.setOccupancy(0)
			let openRoom = effect.roomAcoustics()
			effect.setOccupancy(1)
			let dampedRoom = effect.roomAcoustics()
			try require(
				dampedRoom.decayLow < openRoom.decayLow
					&& dampedRoom.decayHigh < openRoom.decayHigh,
				"Curtains and festival setups must damp both reverb decay bands")
			try require(
				dampedRoom.minDelay == openRoom.minDelay
					&& dampedRoom.maxDelay == openRoom.maxDelay,
				"Venue setups must retain the same room geometry")
		}
		effect.setOccupancy(2)
		try require(effect.occupancy == 1, "Audience occupancy must stay within the supported range")
		effect.setOccupancy(Double.nan)
		try require(
			effect.occupancy == 0, "Invalid occupancy must normalize to the empty-room profile")
		effect = EffectSetting()
		try require(
			!effect.enabled && effect.amount == 0,
			"Replacement station must reset effect settings")
	}
}
