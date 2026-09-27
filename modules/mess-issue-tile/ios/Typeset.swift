import SwiftUI
import UIKit

/// The serif the Mess sets its headlines in: New York, through the system font's serif design.
func serifFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
	let base = UIFont.systemFont(ofSize: size, weight: weight)
	guard let serif = base.fontDescriptor.withDesign(.serif) else { return base }
	return UIFont(descriptor: serif, size: size)
}

/// Text set as a newspaper sets it: hyphenated, and justified when asked.
func paperStyle(justified: Bool, indent: CGFloat = 0, after: CGFloat = 0) -> NSParagraphStyle {
	let style = NSMutableParagraphStyle()
	style.hyphenationFactor = 1
	style.alignment = justified ? .justified : .natural
	style.firstLineHeadIndent = indent
	style.paragraphSpacing = after
	style.lineBreakMode = .byWordWrapping
	return style
}

/// A headline in the serif, hyphenated, cut off with "…" at its last line. SwiftUI's `Text`
/// takes no hyphenation setting, so the headline is a UIKit label.
struct Headline: UIViewRepresentable {
	let text: String
	let size: CGFloat
	let lines: Int
	let color: Color

	func makeUIView(context: Context) -> UILabel {
		let label = UILabel()
		label.numberOfLines = lines
		label.lineBreakMode = .byTruncatingTail
		label.isAccessibilityElement = false
		label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
		return label
	}

	func updateUIView(_ label: UILabel, context: Context) {
		label.numberOfLines = lines
		label.attributedText = NSAttributedString(string: text, attributes: [
			.font: serifFont(size: size, weight: .semibold),
			.foregroundColor: UIColor(color),
			.paragraphStyle: paperStyle(justified: false),
		])
		// A label truncates only with its own line break mode; the paragraph style's is for wrapping.
		label.lineBreakMode = .byTruncatingTail
	}

	func sizeThatFits(_ proposal: ProposedViewSize, uiView label: UILabel, context: Context) -> CGSize? {
		let width = proposal.width ?? 200
		let fitted = label.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
		return CGSize(width: width, height: fitted.height)
	}
}

/// A story set in columns, hyphenated and justified, flowing from one column to the next, with an
/// optional block at the top of the first columns kept clear for a photo. Decoration: too small to
/// read, and hidden from VoiceOver. It uses TextKit 1, whose layout manager flows one text through
/// several containers, which is what columns are.
struct ColumnText: UIViewRepresentable {
	let paragraphs: [String]
	let columns: Int
	/// How many columns, from the left, start below `clearHeight`
	let clearedColumns: Int
	let clearHeight: CGFloat
	let ink: Color
	let rule: Color
	/// Points: the top tile's type, or the smaller type under a grid tile's fold
	var size: CGFloat = 4.6

	func makeUIView(context: Context) -> ColumnTextView {
		let view = ColumnTextView()
		view.isOpaque = false
		view.backgroundColor = .clear
		view.contentMode = .redraw
		view.isAccessibilityElement = false
		view.accessibilityElementsHidden = true
		return view
	}

	func updateUIView(_ view: ColumnTextView, context: Context) {
		let ink = UIColor(ink)
		let rule = UIColor(rule)
		// SwiftUI updates the view whenever anything above it changes, such as a story being
		// opened elsewhere; laying out the columns again is only worth it when what they show
		// has changed. A change of size redraws on its own, through `contentMode = .redraw`.
		let changed = view.paragraphs != paragraphs || view.columns != columns
			|| view.clearedColumns != clearedColumns || view.clearHeight != clearHeight
			|| view.ink != ink || view.rule != rule || view.size != size
		guard changed else { return }
		view.paragraphs = paragraphs
		view.columns = columns
		view.clearedColumns = clearedColumns
		view.clearHeight = clearHeight
		view.ink = ink
		view.rule = rule
		view.size = size
		view.setNeedsDisplay()
	}
}

final class ColumnTextView: UIView {
	var paragraphs: [String] = []
	var columns = 3
	var clearedColumns = 0
	var clearHeight: CGFloat = 0
	var ink: UIColor = .label
	var rule: UIColor = .separator

	var size: CGFloat = 4.6
	private var gutter: CGFloat { size * 2 }

	override func draw(_ rect: CGRect) {
		guard !paragraphs.isEmpty, columns > 0 else { return }
		let width = (bounds.width - gutter * CGFloat(columns - 1)) / CGFloat(columns)
		guard width > 0 else { return }

		let storage = NSTextStorage(string: paragraphs.joined(separator: "\n"), attributes: [
			.font: UIFont(descriptor: UIFontDescriptor(name: "Georgia", size: size), size: size),
			.foregroundColor: ink.withAlphaComponent(0.8),
			.paragraphStyle: paperStyle(justified: true, indent: size, after: size * 0.4),
		])
		let layout = NSLayoutManager()
		storage.addLayoutManager(layout)

		for column in 0..<columns {
			let top = column < clearedColumns ? clearHeight + 5 : 0
			let container = NSTextContainer(size: CGSize(width: width, height: max(bounds.height - top, 0)))
			container.lineFragmentPadding = 0
			layout.addTextContainer(container)
			let origin = CGPoint(x: CGFloat(column) * (width + gutter), y: top)
			let glyphs = layout.glyphRange(for: container)
			layout.drawGlyphs(forGlyphRange: glyphs, at: origin)

			if column > 0 {
				let x = origin.x - gutter / 2
				let line = UIBezierPath()
				line.move(to: CGPoint(x: x, y: top))
				line.addLine(to: CGPoint(x: x, y: bounds.height))
				rule.setStroke()
				line.lineWidth = 0.5
				line.stroke()
			}
		}
	}
}
