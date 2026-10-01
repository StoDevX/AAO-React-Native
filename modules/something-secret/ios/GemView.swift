import CoreMotion
import SwiftUI

/// Which way is up, in the screen's own terms, from the phone's motion sensors: x right, y down,
/// z out toward the eye. Nil until the first reading, and on a device without the sensors.
@MainActor
final class TiltSource: ObservableObject {
	@Published private(set) var up: SIMD3<Double>?

	private let manager = CMMotionManager()

	func start() {
		guard manager.isDeviceMotionAvailable, !manager.isDeviceMotionActive else { return }
		manager.deviceMotionUpdateInterval = 1.0 / 30
		manager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
			guard let gravity = motion?.gravity else { return }
			// Up is against gravity; the device's y runs up the screen, the screen's runs down.
			self?.up = SIMD3(-gravity.x, gravity.y, -gravity.z)
		}
	}

	func stop() {
		manager.stopDeviceMotionUpdates()
	}
}

/// The light both the stone and the gem are lit by: a lamp overhead in the room, seen from the
/// phone's angle, so tilting the phone turns the surfaces through it. `towardEye` leans it toward
/// the viewer, so a phone held upright still catches it.
func overheadLight(up: SIMD3<Double>, towardEye: Double = 0.8) -> SIMD3<Double> {
	up + SIMD3(0, 0, towardEye)
}

/// The wide ruby the open slab holds, with `label` engraved into it, lit from the phone's tilt.
/// With no motion sensors, the light circles slowly instead, and holds still under Reduce Motion.
struct GemView: View {
	/// The frame; the stone itself is a little smaller, leaving room for its glint's rays.
	static let width: CGFloat = 200
	static let height: CGFloat = 110
	/// Which way is up from the phone's sensors, or nil without them.
	let up: SIMD3<Double>?
	let label: String
	/// Where the circling light rests when it may not move: over one shoulder, so facets still shine.
	private static let restingTime = 1.2
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	var body: some View {
		TimelineView(.animation(minimumInterval: nil, paused: reduceMotion && up == nil)) { context in
			// Wrapped, so a Float in the shader keeps its precision.
			let time =
				reduceMotion
				? Self.restingTime : context.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1000)
			let light = light(at: time)
			// The engraving's mask: the label in white on black, which the shader cuts into the stone.
			// Opaque, so the layer spans the whole frame; a clear one ends at the text.
			ZStack {
				Color.black
				Text(label)
					.font(.system(size: 15, weight: .heavy, design: .serif))
					.foregroundStyle(.white)
					.blur(radius: 0.5)
			}
			.frame(width: Self.width, height: Self.height)
			.compositingGroup()
			.layerEffect(
				MeltShaders.library.gem(
					.float(time), .float2(Self.width, Self.height), .float3(light.x, light.y, light.z)),
				maxSampleOffset: CGSize(width: 2, height: 2))
		}
		.frame(width: Self.width, height: Self.height)
	}

	private func light(at time: Double) -> SIMD3<Double> {
		if let up {
			return overheadLight(up: up)
		}
		return SIMD3(cos(time * 0.8) * 0.7, sin(time * 0.8) * 0.7, 1)
	}
}
