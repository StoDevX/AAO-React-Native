import ExpoModulesCore
import SwiftUI

/// Maps clamps a place's About text to its first five lines.
private let clampedLines = 5

final class PlaceCardAboutProps: ExpoSwiftUI.ViewProps {
	@Field var text: String = ""
	@Field var testID: String?
}

/// Maps leaves this much space between the ellipsis and MORE.
private let moreGap: CGFloat = 12

/// A place card's About text as Apple Maps sets it: the first five lines, the
/// last of them cut short with an ellipsis, and MORE at its trailing end when
/// there is more to read. A tap on the text or on MORE shows the rest in place,
/// where it can be selected.
///
/// Native because only TextKit can say where the fifth line starts, which is
/// what cutting that line short to make room for MORE needs.
struct PlaceCardAboutView: ExpoSwiftUI.View {
	@ObservedObject var props: PlaceCardAboutProps

	init(props: PlaceCardAboutProps) {
		self.props = props
	}

	@Environment(\.dynamicTypeSize) private var dynamicTypeSize
	@State private var expanded = false
	@State private var width: CGFloat = 0

	/// The body font at the current text size. The text is drawn in exactly
	/// the font it is measured in, so TextKit and SwiftUI break its lines alike.
	private var bodyFont: UIFont {
		let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(dynamicTypeSize))
		return UIFont.preferredFont(forTextStyle: .body, compatibleWith: traits)
	}

	private var moreFont: UIFont {
		UIFont.systemFont(ofSize: bodyFont.pointSize, weight: .semibold)
	}

	/// The text cut short to leave room for MORE, or nil when it all fits in
	/// five lines -- or has been expanded.
	private var shortened: String? {
		guard !expanded, width > 0 else { return nil }
		let reserve = ("MORE" as NSString).size(withAttributes: [.font: moreFont]).width + moreGap
		return shortenedText(props.text, width: width, font: bodyFont, reserve: reserve)
	}

	var body: some View {
		let shortened = self.shortened
		Group {
			// Selectable only once expanded: cut short, a copy would hold only
			// the lines on screen.
			if expanded {
				SelectableText(text: props.text, font: bodyFont)
			} else {
				Text(shortened ?? props.text)
			}
		}
			.font(Font(bodyFont))
			// A backstop for the frame before the width is known, and for any
			// line SwiftUI breaks differently from TextKit.
			.lineLimit(expanded ? nil : clampedLines)
			.frame(maxWidth: .infinity, alignment: .leading)
			.onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width = $0 }
			.overlay(alignment: .bottomTrailing) {
				if shortened != nil {
					Text("MORE")
						.font(Font(moreFont))
						.accessibilityHidden(true)
				}
			}
			.contentShape(Rectangle())
			.onTapGesture {
				if shortened != nil {
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
				if shortened != nil {
					Button("Show more") { expanded = true }
				}
			}
			.accessibilityIdentifier(props.testID ?? "")
	}
}

/// Text the reader can select and copy. UIKit's, because SwiftUI's own
/// `textSelection` does nothing in the card's list: the place card scaffold's
/// `safeAreaBar` switches it off.
private struct SelectableText: UIViewRepresentable {
	let text: String
	let font: UIFont

	func makeUIView(context: Context) -> UITextView {
		let view = UITextView()
		view.isEditable = false
		view.isScrollEnabled = false
		view.backgroundColor = .clear
		// Laid out as `shortenedText` measures, so the expanded text breaks
		// its lines where the shortened text did.
		view.textContainerInset = .zero
		view.textContainer.lineFragmentPadding = 0
		return view
	}

	func updateUIView(_ view: UITextView, context: Context) {
		view.text = text
		view.font = font
		view.textColor = .label
	}

	func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
		guard let width = proposal.width else { return nil }
		let fitted = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
		return CGSize(width: width, height: fitted.height)
	}
}

/// `text` as its first five lines at `width`, the fifth cut back a word at a
/// time until it and an ellipsis leave `reserve` points free at its end; nil
/// when the text fits in five lines as it is.
private func shortenedText(_ text: String, width: CGFloat, font: UIFont, reserve: CGFloat) -> String? {
	let storage = NSTextStorage(string: text, attributes: [.font: font])
	let layout = NSLayoutManager()
	let container = NSTextContainer(size: CGSize(width: width, height: .greatestFiniteMagnitude))
	container.lineFragmentPadding = 0
	layout.addTextContainer(container)
	storage.addLayoutManager(layout)

	var lineStarts: [Int] = []
	layout.enumerateLineFragments(forGlyphRange: layout.glyphRange(for: container)) { _, _, _, glyphs, stop in
		lineStarts.append(layout.characterIndexForGlyph(at: glyphs.location))
		if lineStarts.count > clampedLines { stop.pointee = true }
	}
	guard lineStarts.count > clampedLines else { return nil }

	let whole = text as NSString
	let lastStart = lineStarts[clampedLines - 1]
	let head = whole.substring(to: lastStart)
	var last = whole.substring(with: NSRange(location: lastStart, length: lineStarts[clampedLines] - lastStart))

	let room = width - reserve
	let trailing = CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: ",;:"))
	func trimmed(_ line: String) -> String {
		String(line.unicodeScalars.reversed().drop(while: trailing.contains).reversed().map(Character.init))
	}
	func fits(_ line: String) -> Bool {
		(trimmed(line) + "…").size(withAttributes: [.font: font]).width <= room
	}
	while !last.isEmpty && !fits(last) {
		// Back a word at a time; a single word too long for the line goes back
		// a character at a time instead.
		let words = trimmed(last)
		if let space = words.rangeOfCharacter(from: .whitespaces, options: .backwards) {
			last = String(words[..<space.lowerBound])
		} else {
			last = String(words.dropLast())
		}
	}
	// A hard break before the last line: cut short, it could otherwise fit
	// back on the line above and leave MORE over that line's end. The lines
	// above are shown whole, so only the space before the break goes.
	return head.trimmingCharacters(in: .whitespacesAndNewlines) + "\n" + trimmed(last) + "…"
}
