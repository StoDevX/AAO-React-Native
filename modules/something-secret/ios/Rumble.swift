import CoreHaptics

/// The long rumble as the slab splits: one continuous haptic, low and strong. SwiftUI's
/// sensoryFeedback has only short taps.
enum Rumble {
	/// Kept alive while it plays; an engine released mid-pattern stops it.
	private static var engine: CHHapticEngine?

	static func play() {
		guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
		do {
			let engine = try engine ?? CHHapticEngine()
			try engine.start()
			Self.engine = engine
			let event = CHHapticEvent(
				eventType: .hapticContinuous,
				parameters: [
					CHHapticEventParameter(parameterID: .hapticIntensity, value: 1),
					CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.15),
				],
				relativeTime: 0,
				duration: 1.2)
			let pattern = try CHHapticPattern(events: [event], parameters: [])
			try engine.makePlayer(with: pattern).start(atTime: CHHapticTimeImmediate)
		} catch {
			// A rumble that fails to play is not worth surfacing; the split still shows.
		}
	}
}
