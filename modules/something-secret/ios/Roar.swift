import AudioToolbox
import Foundation

/// The slab's roar, played as a system sound: system sounds obey the mute switch and never
/// touch the app's audio session, so a KRLX stream playing in Streaming Media carries on.
enum Roar {
	/// Registered once, on the first roar. Nil when the recording is missing from the bundle.
	private static let sound: SystemSoundID? = {
		guard
			let bundleURL = Bundle.main.url(forResource: "SomethingSecret", withExtension: "bundle"),
			let url = Bundle(url: bundleURL)?.url(forResource: "roar", withExtension: "caf")
		else { return nil }
		var id: SystemSoundID = 0
		guard AudioServicesCreateSystemSoundID(url as CFURL, &id) == kAudioServicesNoError else { return nil }
		return id
	}()

	static func play() {
		guard let sound else { return }
		AudioServicesPlaySystemSound(sound)
	}
}
