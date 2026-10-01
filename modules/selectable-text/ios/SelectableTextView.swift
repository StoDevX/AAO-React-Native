import ExpoModulesCore
import SwiftUI

final class SelectableTextProps: ExpoSwiftUI.ViewProps {
	@Field var text: String = ""
	@Field var testID: String?
}

/// A block of body text a reader can select, and whose phone numbers,
/// addresses, links and dates iOS turns into things they can tap -- an org's
/// meeting time, or a course's room.
struct SelectableTextView: ExpoSwiftUI.View {
	@ObservedObject var props: SelectableTextProps

	init(props: SelectableTextProps) {
		self.props = props
	}

	@Environment(\.dynamicTypeSize) private var dynamicTypeSize

	var body: some View {
		SelectableUITextView(
			text: props.text,
			font: .body(at: dynamicTypeSize),
			detectedTypes: [.link, .phoneNumber, .address, .calendarEvent]
		)
			.frame(maxWidth: .infinity, alignment: .leading)
			.accessibilityIdentifier(props.testID ?? "")
	}
}
