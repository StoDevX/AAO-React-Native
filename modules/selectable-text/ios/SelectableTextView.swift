import ExpoModulesCore
import SwiftUI

/// A stretch of a paragraph sharing one style.
struct SelectableTextRun: Record {
	@Field var text: String = ""
	@Field var bold: Bool = false
	@Field var italic: Bool = false
	@Field var smallCaps: Bool = false
	@Field var href: String?
}

/// One paragraph of styled text.
struct SelectableTextParagraph: Record {
	@Field var runs: [SelectableTextRun] = []
	@Field var italic: Bool = false
	@Field var indent: Double = 0
	@Field var marker: String?
	@Field var spacingAfter: Double?
}

/// The Dynamic Type styles the text can be set in.
enum SelectableTextStyle: String, Enumerable {
	case body
	case footnote

	var uiTextStyle: UIFont.TextStyle {
		switch self {
		case .body: .body
		case .footnote: .footnote
		}
	}
}

final class SelectableTextProps: ExpoSwiftUI.ViewProps {
	@Field var text: String = ""
	@Field var paragraphs: [SelectableTextParagraph] = []
	@Field var textStyle: SelectableTextStyle = .body
	@Field var serif: Bool = false
	@Field var italic: Bool = false
	@Field var color: UIColor?
	@Field var linkColor: UIColor?
	@Field var lineSpacing: Double = 0
	@Field var paragraphSpacing: Double = 0
	@Field var testID: String?
}

/// A block of text the reader can select. Plain text has its phone numbers,
/// addresses, links and dates turned into things to tap -- an org's meeting
/// time, or a course's room. Styled paragraphs carry their own links, and are
/// one text view so a selection can run from one paragraph into the next -- a
/// stretch of a Mess story.
struct SelectableTextView: ExpoSwiftUI.View {
	@ObservedObject var props: SelectableTextProps

	init(props: SelectableTextProps) {
		self.props = props
	}

	@Environment(\.dynamicTypeSize) private var dynamicTypeSize

	var body: some View {
		Group {
			if props.paragraphs.isEmpty {
				SelectableUITextView(
					text: props.text,
					font: .body(at: dynamicTypeSize),
					detectedTypes: [.link, .phoneNumber, .address, .calendarEvent]
				)
			} else {
				SelectableUITextView(attributedText: attributedParagraphs(), linkColor: props.linkColor)
					// TextKit sets a line's leading under every line, the last too, where SwiftUI sets
					// it only between lines; without this the text would sit a leading further from
					// whatever follows it than a SwiftUI `Text` does. The leading is blank, so nothing
					// drawn is lost.
					.padding(.bottom, -font().leading)
			}
		}
			.frame(maxWidth: .infinity, alignment: .leading)
			.accessibilityIdentifier(props.testID ?? "")
	}

	private func font(bold: Bool = false, italic: Bool = false, smallCaps: Bool = false) -> UIFont {
		UIFont.styled(
			props.textStyle.uiTextStyle,
			at: dynamicTypeSize,
			serif: props.serif,
			bold: bold,
			italic: italic || props.italic,
			smallCaps: smallCaps
		)
	}

	/// The paragraphs as one string, a paragraph break between each, every paragraph in its
	/// own paragraph style.
	private func attributedParagraphs() -> NSAttributedString {
		let result = NSMutableAttributedString()
		let color = props.color ?? UIColor.label
		for (index, paragraph) in props.paragraphs.enumerated() {
			let isLast = index == props.paragraphs.count - 1
			let style = NSMutableParagraphStyle()
			style.lineSpacing = props.lineSpacing
			// The last paragraph's spacing would only pad the view's bottom edge. TextKit already
			// leaves a line's leading under a paragraph, which SwiftUI's spacing between `Text`s
			// does not count, so it comes off the spacing asked for.
			let spacing = paragraph.spacingAfter ?? props.paragraphSpacing
			style.paragraphSpacing = isLast ? 0 : max(0, spacing - font().leading)
			style.firstLineHeadIndent = paragraph.indent
			style.headIndent = paragraph.indent

			let start = result.length
			if let marker = paragraph.marker {
				// The marker sits at the paragraph's edge and its text starts a gap after it, as
				// a list does; wrapped lines line up with the text, not the marker.
				let markerFont = font()
				let textStart = paragraph.indent + (marker as NSString).size(withAttributes: [.font: markerFont]).width + 8
				style.headIndent = textStart
				style.tabStops = [NSTextTab(textAlignment: .natural, location: textStart)]
				result.append(NSAttributedString(
					string: marker + "\t",
					attributes: [.font: markerFont, .foregroundColor: color]
				))
			}
			for run in paragraph.runs {
				var attributes: [NSAttributedString.Key: Any] = [
					.font: font(bold: run.bold, italic: run.italic || paragraph.italic, smallCaps: run.smallCaps),
					.foregroundColor: color,
				]
				if let href = run.href, let url = URL(string: href) {
					attributes[.link] = url
				}
				result.append(NSAttributedString(string: run.text, attributes: attributes))
			}
			if !isLast {
				result.append(NSAttributedString(string: "\n", attributes: [.font: font(), .foregroundColor: color]))
			}
			result.addAttribute(.paragraphStyle, value: style, range: NSRange(location: start, length: result.length - start))
		}
		return result
	}
}
