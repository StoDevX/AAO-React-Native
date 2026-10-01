import CoreMotion
import Foundation

/// Watches the accelerometer for about three seconds of hard shaking, and reports it once.
/// Runs only while asked to, so the accelerometer is off outside a lockout.
final class ShakeWatch {
	/// Total acceleration, in g, above which a reading counts as hard. Gravity alone is 1.
	private static let hard = 2.2
	/// How long the shaking must go on.
	private static let needed: TimeInterval = 3
	/// A pause longer than this starts the count again.
	private static let allowedGap: TimeInterval = 0.5

	private let manager = CMMotionManager()
	private var shakingSince: Date?
	private var lastHard: Date?

	func start(onEscape: @escaping () -> Void) {
		guard manager.isAccelerometerAvailable, !manager.isAccelerometerActive else { return }
		shakingSince = nil
		lastHard = nil
		manager.accelerometerUpdateInterval = 1.0 / 50
		manager.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
			guard let self, let a = data?.acceleration else { return }
			let magnitude = (a.x * a.x + a.y * a.y + a.z * a.z).squareRoot()
			guard magnitude > Self.hard else { return }
			let now = Date.now
			if let lastHard, now.timeIntervalSince(lastHard) <= Self.allowedGap, let since = self.shakingSince {
				if now.timeIntervalSince(since) >= Self.needed {
					self.stop()
					onEscape()
					return
				}
			} else {
				self.shakingSince = now
			}
			self.lastHard = now
		}
	}

	func stop() {
		manager.stopAccelerometerUpdates()
	}
}
