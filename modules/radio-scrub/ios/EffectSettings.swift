import Foundation

/// UI settings remain separate from audio-unit parameters, including when disabled.
struct EffectSetting {
	var enabled = false
	private(set) var amount = 0.0
	private(set) var delayMs = 250.0
	private(set) var feedback = 25.0
	private(set) var resonance = 0.0
	private(set) var lowCut = 0.0
	private(set) var preset = 1
	private(set) var occupancy = 0.0

	mutating func set(_ active: Bool, _ value: Double) {
		enabled = active
		amount = Self.finiteClamp(value, 0, 1, 0)
	}

	mutating func setDelay(_ value: Double) { delayMs = Self.finiteClamp(value, 50, 1000, 250) }
	mutating func setFeedback(_ value: Double) { feedback = Self.finiteClamp(value, 0, 75, 25) }
	mutating func setLowCut(_ value: Double) { lowCut = Self.finiteClamp(value, 0, 1, 0) }
	mutating func setResonance(_ value: Double) { resonance = Self.finiteClamp(value, 0, 100, 0) }
	mutating func setPreset(_ value: Double) { preset = Int(Self.finiteClamp(value, 0, 8, 1).rounded()) }
	mutating func setOccupancy(_ value: Double) { occupancy = Self.finiteClamp(value, 0, 1, 0) }

	struct RoomAcoustics {
		let minDelay: Double
		let maxDelay: Double
		var decayLow: Double
		var decayHigh: Double
	}

	/// Algorithmic room approximations from dimensions and clap-time estimates.
	func roomAcoustics() -> RoomAcoustics {
		var room: RoomAcoustics
		switch preset {
		case 4: room = RoomAcoustics(minDelay: 0.015, maxDelay: 0.115, decayLow: 2.25, decayHigh: 1.6)
		case 5: return RoomAcoustics(minDelay: 0.012, maxDelay: 0.06, decayLow: 1, decayHigh: 0.6)
		case 6: return RoomAcoustics(minDelay: 0.018, maxDelay: 0.09, decayLow: 1.75, decayHigh: 1.2)
		case 7:
			return RoomAcoustics(
				minDelay: 0.012, maxDelay: 0.08, decayLow: 2 - 0.7 * occupancy,
				decayHigh: 1.4 - 0.5 * occupancy)
		case 8:
			return RoomAcoustics(
				minDelay: 0.03, maxDelay: 0.14, decayLow: 2.5 - occupancy,
				decayHigh: 1.8 - 0.8 * occupancy)
		default: room = RoomAcoustics(minDelay: 0.022, maxDelay: 0.125, decayLow: 3, decayHigh: 2.1)
		}
		let absorption = 1 - occupancy / 3
		room.decayLow *= absorption
		room.decayHigh *= absorption
		return room
	}

	func active() -> Bool { enabled && (amount > 0 || lowCut > 0) }
	func highCutActive() -> Bool { enabled && amount > 0 }
	func lowCutActive() -> Bool { enabled && lowCut > 0 }
	func lowCutFrequency() -> Double { 20 * pow(4000.0 / 20, enabled ? lowCut : 0) }
	func bandwidth() -> Double { 2 * pow(0.1 / 2, resonance / 100) }
	func cutoff() -> Double { 20000 * pow(250.0 / 20000, enabled ? amount : 0) }
	func wet(_ maximum: Double) -> Double { enabled ? amount * maximum : 0 }

	private static func finiteClamp(_ value: Double, _ low: Double, _ high: Double, _ fallback: Double)
		-> Double
	{
		value.isFinite ? min(high, max(low, value)) : fallback
	}

	/// Normalizes a linear crossfade's power without changing its wet/dry ratio.
	static func reverbMakeupDb(_ percent: Double) -> Double {
		let wet = finiteClamp(percent, 0, 100, 0) / 100
		let dry = 1 - wet
		return -10 * log10(dry * dry + wet * wet)
	}

	var status: [String: Any] {
		[
			"enabled": enabled, "amount": amount, "delayMs": delayMs, "feedback": feedback,
			"resonance": resonance, "preset": preset, "lowCut": lowCut, "highCut": amount,
			"occupancy": occupancy,
		]
	}
}
