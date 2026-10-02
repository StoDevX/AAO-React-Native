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

/// UIKit drawing in a canvas: the canvas's context made the current UIKit one, so string and
/// TextKit drawing land in it. The tile draws its type this way rather than hosting UIKit views,
/// which `ImageRenderer` cannot draw into the tile's cached image.
private func drawWithUIKit(_ context: inout GraphicsContext, _ draw: () -> Void) {
	context.withCGContext { cg in
		UIGraphicsPushContext(cg)
		draw()
		UIGraphicsPopContext()
	}
}

/// A headline in the serif, hyphenated, cut off with "…" at its last line. SwiftUI's `Text`
/// takes no hyphenation setting, so a UIKit label sets it, sized and drawn here.
struct Headline: View {
	let text: String
	let size: CGFloat
	let lines: Int
	let color: Color

	var body: some View {
		let label = makeLabel()
		FittedHeight(height: { width in
			label.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude)).height
		}) {
			Canvas { context, size in
				drawWithUIKit(&context) {
					label.drawText(in: CGRect(origin: .zero, size: size))
				}
			}
		}
	}

	private func makeLabel() -> UILabel {
		let label = UILabel()
		label.numberOfLines = lines
		label.attributedText = NSAttributedString(string: text, attributes: [
			.font: serifFont(size: size, weight: .semibold),
			.foregroundColor: UIColor(color),
			.paragraphStyle: paperStyle(justified: false),
		])
		// A label truncates only with its own line break mode; the paragraph style's is for wrapping.
		label.lineBreakMode = .byTruncatingTail
		return label
	}
}

/// Takes the width it is offered and the height `height` gives for that width, as a label does.
private struct FittedHeight: Layout {
	let height: (CGFloat) -> CGFloat

	func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
		let width = proposal.width ?? 200
		return CGSize(width: width, height: height(width))
	}

	func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
		for subview in subviews {
			subview.place(at: bounds.origin, proposal: ProposedViewSize(bounds.size))
		}
	}
}

/// A story set in columns, hyphenated and justified, flowing from one column to the next, with an
/// optional block at the top of the first columns kept clear for a photo. Decoration: too small to
/// read, and hidden from VoiceOver. It uses TextKit 1, whose layout manager flows one text through
/// several containers, which is what columns are.
struct ColumnText: View, Equatable {
	let paragraphs: [String]
	let columns: Int
	/// How many columns, from the left, start below `clearHeight`
	let clearedColumns: Int
	let clearHeight: CGFloat
	let ink: Color
	let rule: Color
	/// Points: the top tile's type, or the smaller type under a grid tile's fold
	var size: CGFloat = 4.6

	private var gutter: CGFloat { size * 2 }

	var body: some View {
		Canvas { context, canvasSize in
			drawWithUIKit(&context) {
				draw(in: CGRect(origin: .zero, size: canvasSize))
			}
		}
		.accessibilityHidden(true)
	}

	private func draw(in bounds: CGRect) {
		guard !paragraphs.isEmpty, columns > 0 else { return }
		let width = (bounds.width - gutter * CGFloat(columns - 1)) / CGFloat(columns)
		guard width > 0 else { return }

		let storage = NSTextStorage(string: paragraphs.joined(separator: "\n"), attributes: [
			.font: UIFont(descriptor: UIFontDescriptor(name: "Georgia", size: size), size: size),
			.foregroundColor: UIColor(ink).withAlphaComponent(0.8),
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
				UIColor(rule).setStroke()
				line.lineWidth = 0.5
				line.stroke()
			}
		}
	}
}
