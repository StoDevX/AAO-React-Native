import ExpoModulesCore
import SwiftUI
import UIKit

public class HyphenatedTextModule: Module {
	public func definition() -> ModuleDefinition {
		Name("HyphenatedText")

		View(HyphenatedTextView.self)
	}
}

final class HyphenatedTextProps: ExpoSwiftUI.ViewProps {
	@Field var text: String = ""
}

/// A paragraph in the body style and secondary color that hyphenates. SwiftUI's `Text` takes
/// no hyphenation setting, so a UIKit label sets it.
struct HyphenatedTextView: ExpoSwiftUI.View {
	@ObservedObject var props: HyphenatedTextProps

	init(props: HyphenatedTextProps) {
		self.props = props
	}

	var body: some View {
		HyphenatedLabel(text: props.text)
	}
}

private struct HyphenatedLabel: UIViewRepresentable {
	let text: String

	func makeUIView(context: Context) -> UILabel {
		let label = UILabel()
		label.numberOfLines = 0
		label.adjustsFontForContentSizeCategory = true
		label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
		return label
	}

	func updateUIView(_ label: UILabel, context: Context) {
		let style = NSMutableParagraphStyle()
		style.hyphenationFactor = 1
		label.attributedText = NSAttributedString(string: text, attributes: [
			.font: UIFont.preferredFont(forTextStyle: .body),
			.foregroundColor: UIColor.secondaryLabel,
			.paragraphStyle: style,
		])
	}

	/// Takes the width offered and the height the label needs at it.
	func sizeThatFits(_ proposal: ProposedViewSize, uiView label: UILabel, context: Context) -> CGSize? {
		let width = proposal.width ?? 300
		let height = label.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude)).height
		return CGSize(width: width, height: height)
	}
}
