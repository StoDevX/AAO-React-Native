import CoreText
import SwiftUI
import UIKit

public extension UIFont {
	/// The body text style at a SwiftUI text size, for UIKit text that has to
	/// sit at the size of the SwiftUI text around it.
	static func body(at size: DynamicTypeSize) -> UIFont {
		let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
		return UIFont.preferredFont(forTextStyle: .body, compatibleWith: traits)
	}

	/// A text style at a SwiftUI text size, in the serif design if asked, and bold, italic or
	/// in small capitals, as a SwiftUI `Text` sets them with `.serif`, `.bold()`, `.italic()`
	/// and `.smallCaps()`.
	static func styled(
		_ style: UIFont.TextStyle,
		at size: DynamicTypeSize,
		serif: Bool = false,
		bold: Bool = false,
		italic: Bool = false,
		smallCaps: Bool = false
	) -> UIFont {
		let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
		var descriptor = UIFontDescriptor.preferredFontDescriptor(withTextStyle: style, compatibleWith: traits)
		if serif, let serifDescriptor = descriptor.withDesign(.serif) {
			descriptor = serifDescriptor
		}
		var symbolic = descriptor.symbolicTraits
		if bold { symbolic.insert(.traitBold) }
		if italic { symbolic.insert(.traitItalic) }
		descriptor = descriptor.withSymbolicTraits(symbolic) ?? descriptor
		if smallCaps {
			// Both cases in small capitals, as SwiftUI's `smallCaps()` sets them.
			descriptor = descriptor.addingAttributes([
				.featureSettings: [
					[UIFontDescriptor.FeatureKey.type: kLowerCaseType, .selector: kLowerCaseSmallCapsSelector],
					[UIFontDescriptor.FeatureKey.type: kUpperCaseType, .selector: kUpperCaseSmallCapsSelector],
				],
			])
		}
		return UIFont(descriptor: descriptor, size: 0)
	}
}

/// Text the reader can select and copy, in a UITextView. UIKit's, because
/// SwiftUI's `textSelection` has no data detectors, cannot carry a selection
/// from one `Text` into the next, takes a held link for a selection rather than
/// offering the link's menu, and does nothing at all in a list under a
/// `safeAreaBar`.
///
/// The text runs to the view's edges, with no inset or line padding, so it
/// breaks its lines where TextKit measures them at the same width.
public struct SelectableUITextView: UIViewRepresentable {
	let attributedText: NSAttributedString
	let detectedTypes: UIDataDetectorTypes
	let linkColor: UIColor?

	/// Plain text in one font, in the label colour.
	public init(text: String, font: UIFont, detectedTypes: UIDataDetectorTypes = []) {
		self.attributedText = NSAttributedString(
			string: text,
			attributes: [.font: font, .foregroundColor: UIColor.label]
		)
		self.detectedTypes = detectedTypes
		self.linkColor = nil
	}

	/// Styled text, its links drawn in `linkColor`, or the tint colour without one.
	public init(attributedText: NSAttributedString, linkColor: UIColor? = nil, detectedTypes: UIDataDetectorTypes = []) {
		self.attributedText = attributedText
		self.detectedTypes = detectedTypes
		self.linkColor = linkColor
	}

	public func makeCoordinator() -> Coordinator {
		Coordinator()
	}

	public func makeUIView(context: Context) -> UITextView {
		let view = UITextView()
		view.delegate = context.coordinator
		view.isEditable = false
		view.isScrollEnabled = false
		view.backgroundColor = .clear
		view.textContainerInset = .zero
		view.textContainer.lineFragmentPadding = 0
		return view
	}

	public func updateUIView(_ view: UITextView, context: Context) {
		context.coordinator.openURL = context.environment.openURL
		if let linkColor {
			view.linkTextAttributes = [.foregroundColor: linkColor]
		}
		view.attributedText = attributedText
		view.dataDetectorTypes = detectedTypes
	}

	public func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
		guard let width = proposal.width else { return nil }
		let fitted = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
		return CGSize(width: width, height: fitted.height)
	}

	/// Sends a tapped web link to SwiftUI's `openURL` action, as a SwiftUI `Text` link goes, so an
	/// `openURLAction` modifier above this view decides where it opens; with none, SwiftUI opens
	/// it in Safari, as the text view would. Any other scheme, such as `tel:`, keeps the text
	/// view's own action.
	public final class Coordinator: NSObject, UITextViewDelegate {
		var openURL: OpenURLAction?

		public func textView(
			_ textView: UITextView,
			primaryActionFor textItem: UITextItem,
			defaultAction: UIAction
		) -> UIAction? {
			guard case .link(let url) = textItem.content,
				let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https",
				let openURL
			else { return defaultAction }
			return UIAction { _ in openURL(url) }
		}
	}
}
