import SwiftUI
import UIKit

public extension UIFont {
	/// The body text style at a SwiftUI text size, for UIKit text that has to
	/// sit at the size of the SwiftUI text around it.
	static func body(at size: DynamicTypeSize) -> UIFont {
		let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
		return UIFont.preferredFont(forTextStyle: .body, compatibleWith: traits)
	}
}

/// Text the reader can select and copy, in a UITextView. UIKit's, because
/// SwiftUI's `textSelection` has no data detectors, and does nothing at all
/// in a list under a `safeAreaBar`.
///
/// The text runs to the view's edges, with no inset or line padding, so it
/// breaks its lines where TextKit measures them at the same width.
public struct SelectableUITextView: UIViewRepresentable {
	let text: String
	let font: UIFont
	let detectedTypes: UIDataDetectorTypes

	public init(text: String, font: UIFont, detectedTypes: UIDataDetectorTypes = []) {
		self.text = text
		self.font = font
		self.detectedTypes = detectedTypes
	}

	public func makeUIView(context: Context) -> UITextView {
		let view = UITextView()
		view.isEditable = false
		view.isScrollEnabled = false
		view.backgroundColor = .clear
		view.textContainerInset = .zero
		view.textContainer.lineFragmentPadding = 0
		return view
	}

	public func updateUIView(_ view: UITextView, context: Context) {
		view.text = text
		view.font = font
		view.textColor = .label
		view.dataDetectorTypes = detectedTypes
	}

	public func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
		guard let width = proposal.width else { return nil }
		let fitted = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
		return CGSize(width: width, height: fitted.height)
	}
}
