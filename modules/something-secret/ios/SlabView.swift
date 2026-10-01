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
	}

	private var slab: some View {
		Button {
			props.onSlabTap()
		} label: {
			ZStack(alignment: .bottom) {
				Color.clear
				SlabDrawing(
					stage: props.stage, fraction: props.fraction, inscription: props.inscription,
					reduceMotion: reduceMotion)
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
			Text(props.buttonLabel)
				.font(.headline)
				.foregroundStyle(.white)
				.padding(.horizontal, 24)
				.frame(minWidth: 150, minHeight: 64)
				.background(
					Capsule().fill(
						RadialGradient(
							colors: [Color(red: 0.96, green: 0.16, blue: 0.12), Color(red: 0.55, green: 0.02, blue: 0.02)],
							center: .center, startRadius: 4, endRadius: 100)))
				.contentShape(Capsule())
		}
		.buttonStyle(.plain)
		.accessibilityIdentifier(props.buttonTestID ?? "")
		.padding(.bottom, 50)
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
