import ExpoModulesCore
import SwiftUI

enum SlabStage: String, Enumerable {
	case blank
	case tremor
	case edge
	case risen
	case cracking
	case open
}

final class SlabViewProps: ExpoSwiftUI.ViewProps {
	@Field var stage: SlabStage = .blank
	/// How far through `stage`, from 0 to 1.
	@Field var fraction: Double = 0
	/// Goes up by one on each tap, and only on a tap, to set off the tap's shake and debris.
	@Field var tapCount: Int = 0
	@Field var inscription: String = ""
	@Field var buttonLabel: String = ""
	@Field var label: String = ""
	@Field var hint: String = ""
	@Field var testID: String?
	@Field var buttonTestID: String?
	var onSlabTap = EventDispatcher()
	var onButtonPress = EventDispatcher()
}

/// The blank space under the home screen's notice, and the slab that tapping it raises. Once the
/// slab splits, the red button behind it takes the taps.
struct SlabView: ExpoSwiftUI.View {
	@ObservedObject var props: SlabViewProps

	init(props: SlabViewProps) {
		self.props = props
	}

	@Environment(\.accessibilityReduceMotion) private var reduceMotion
	/// Read only while the slab is above ground, so a buried one costs no battery.
	@StateObject private var tilt = TiltSource()
	/// Where the light sits without motion sensors: over the left shoulder.
	private static let stillLight = SIMD3<Double>(-0.5, -0.7, 1.0)

	private var light: SIMD3<Double> {
		tilt.up.map { overheadLight(up: $0) } ?? Self.stillLight
	}

	private var isOpen: Bool { props.stage == .open }

	var body: some View {
		ZStack(alignment: .bottom) {
			if isOpen {
				redButton
			}
			slab
		}
		.frame(maxWidth: .infinity)
		.frame(height: Slab.spaceHeight)
		.sensoryFeedback(trigger: props.tapCount) { _, _ in tapFeedback }
		.onChange(of: isOpen) { _, opened in
			if opened { Rumble.play() }
		}
		.onChange(of: props.stage == .blank, initial: true) { _, isBlank in
			if isBlank { tilt.stop() } else { tilt.start() }
		}
		.onDisappear { tilt.stop() }
	}

	private var slab: some View {
		Button {
			props.onSlabTap()
		} label: {
			ZStack(alignment: .bottom) {
				Color.clear
				SlabDrawing(
					stage: props.stage, fraction: props.fraction, inscription: props.inscription,
					reduceMotion: reduceMotion, light: light)
				if !reduceMotion, let color = debrisColor {
					Debris(trigger: props.tapCount, color: color)
				}
			}
			.frame(height: Slab.spaceHeight)
			.contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		.keyframeAnimator(initialValue: 0.0, trigger: props.tapCount) { content, x in
			content.offset(x: reduceMotion ? 0 : x)
		} keyframes: { _ in
			KeyframeTrack {
				LinearKeyframe(2, duration: 0.04)
				LinearKeyframe(-2, duration: 0.04)
				LinearKeyframe(1, duration: 0.04)
				LinearKeyframe(0, duration: 0.04)
			}
		}
		// Open, the halves have slid aside and the button behind takes the taps.
		.allowsHitTesting(!isOpen)
		.accessibilityElement(children: .ignore)
		.accessibilityLabel(props.label)
		.accessibilityHint(props.hint)
		.accessibilityAddTraits(.isButton)
		.accessibilityIdentifier(props.testID ?? "")
		.accessibilityHidden(isOpen)
	}

	private var redButton: some View {
		Button {
			props.onButtonPress()
		} label: {
			GemView(up: tilt.up, label: props.buttonLabel)
				.contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		// The words are drawn into the stone, so the button names itself.
		.accessibilityLabel(props.buttonLabel)
		.accessibilityIdentifier(props.buttonTestID ?? "")
		.padding(.bottom, 30)
	}

	private var debrisColor: Color? {
		switch props.stage {
		case .tremor, .edge: Slab.dirt
		case .cracking: Slab.chip
		default: nil
		}
	}

	private var tapFeedback: SensoryFeedback? {
		switch props.stage {
		case .blank: nil
		case .tremor: .impact(weight: .light)
		case .edge, .risen: .impact(weight: .medium)
		case .cracking, .open: .impact(weight: .heavy)
		}
	}
}
