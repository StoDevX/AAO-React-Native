import ExpoModulesCore
import SwiftUI

/// Maps clamps a place's About text to its first five lines.
private let clampedLines = 5

final class PlaceCardAboutProps: ExpoSwiftUI.ViewProps {
	@Field var text: String = ""
	@Field var testID: String?
}

/// A place card's About text as Apple Maps sets it: the first five lines, and a
/// trailing MORE over the last of them when there is more to read. A tap on the
/// text or on MORE shows the rest in place.
///
/// Native because it has to know whether the text was cut short, which takes
/// laying the text out twice -- clamped, and at its full height -- and
/// comparing the two.
struct PlaceCardAboutView: ExpoSwiftUI.View {
	@ObservedObject var props: PlaceCardAboutProps

	init(props: PlaceCardAboutProps) {
		self.props = props
	}

	@State private var expanded = false
	@State private var clampedHeight: CGFloat = 0
	@State private var fullHeight: CGFloat = 0

	private var truncated: Bool {
		!expanded && fullHeight > clampedHeight + 0.5
	}

	var body: some View {
		Text(props.text)
			.lineLimit(expanded ? nil : clampedLines)
			.frame(maxWidth: .infinity, alignment: .leading)
			.onGeometryChange(for: CGFloat.self) { $0.size.height } action: { clampedHeight = $0 }
			// The same text, unclamped and unseen, at the width the clamped copy
			// was given: its height is the whole text's.
			.background(alignment: .topLeading) {
				Text(props.text)
					.fixedSize(horizontal: false, vertical: true)
					.hidden()
					.accessibilityHidden(true)
					.onGeometryChange(for: CGFloat.self) { $0.size.height } action: { fullHeight = $0 }
			}
			.overlay(alignment: .bottomTrailing) {
				if truncated {
					Text("MORE")
						.font(.body.weight(.semibold))
						.padding(.leading, 24)
						// Fades the last line out under MORE, as Maps does, on the
						// sheet's own colour.
						.background {
							LinearGradient(
								stops: [
									.init(color: Color(uiColor: .systemGroupedBackground).opacity(0), location: 0),
									.init(color: Color(uiColor: .systemGroupedBackground), location: 0.4),
								],
								startPoint: .leading,
								endPoint: .trailing)
						}
						.accessibilityHidden(true)
				}
			}
			.contentShape(Rectangle())
			.onTapGesture {
				if truncated {
					withAnimation { expanded = true }
				}
			}
			// VoiceOver reads the whole text either way; while it is cut short on
			// screen, an action shows the rest.
			.accessibilityElement(children: .ignore)
			.accessibilityLabel(props.text)
			.accessibilityActions {
				// Only while there is more to show: once expanded, or for text
				// that was never cut short, the action would do nothing.
				if truncated {
					Button("Show more") { expanded = true }
				}
			}
			.accessibilityIdentifier(props.testID ?? "")
	}
}
