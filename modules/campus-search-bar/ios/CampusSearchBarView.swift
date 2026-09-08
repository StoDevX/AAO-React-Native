import ExpoModulesCore
import SwiftUI
import UIKit

/// Apple Maps' search field is 44pt tall. UIKit's default is shorter, so the
/// height is pinned rather than inherited. The picker's margins, the
/// collapsed detent's height, and `CarletonMapScreen.swift`'s scale
/// derivation are all sized against this constant.
private let fieldHeight: CGFloat = 44

/// The bar owns its text. JavaScript hears every change through
/// `onTextChange` and never writes text back: the one change it could want,
/// clearing on Cancel, the bar does itself before reporting it. A `text` prop
/// would make every keystroke a round trip whose echo has to be told apart
/// from a real write, and nothing here needs that.
final class CampusSearchBarProps: ExpoSwiftUI.ViewProps {
	@Field var placeholder: String = ""
	@Field var testID: String?
	var onTextChange = EventDispatcher()
	var onFocusChange = EventDispatcher()
	var onCancel = EventDispatcher()
}

/// The SwiftUI face of the module: what `@expo/ui`'s `Host` mounts as a child.
struct CampusSearchBarView: ExpoSwiftUI.View {
	@ObservedObject var props: CampusSearchBarProps

	init(props: CampusSearchBarProps) {
		self.props = props
	}

	var body: some View {
		SearchBar(props: props)
			.frame(height: fieldHeight)
	}
}

/// UIKit's search bar, because it is the field Apple Maps draws and it owns
/// the Cancel button's appearance and animation.
private struct SearchBar: UIViewRepresentable {
	@ObservedObject var props: CampusSearchBarProps

	func makeCoordinator() -> Coordinator {
		Coordinator(props: props)
	}

	func makeUIView(context: Context) -> UISearchBar {
		let bar = UISearchBar()
		bar.delegate = context.coordinator
		// `.minimal` drops the bar's own background so the sheet's material
		// shows through, leaving only the field itself, as in Maps.
		bar.searchBarStyle = .minimal
		bar.autocorrectionType = .no
		bar.returnKeyType = .search
		// The bar still insets its text field about 8pt from each side on top
		// of this; the picker's horizontal padding is trimmed by that much so
		// the field's visible margin matches Maps'. See
		// `SEARCH_BAR_HORIZONTAL_PADDING` in `building-picker.tsx`.
		bar.directionalLayoutMargins = .zero
		// Required would fight UISearchBar's own (private, undocumented) layout
		// of the text field within the bar; 999 lets that layout win instead of
		// throwing constraint-conflict warnings, at the cost of possibly falling
		// short of 44pt — testTheSearchFieldIsAppleMapsHeight verifies the resulting height.
		let textFieldHeight = bar.searchTextField.heightAnchor.constraint(equalToConstant: fieldHeight)
		textFieldHeight.priority = UILayoutPriority(999)
		textFieldHeight.isActive = true
		return bar
	}

	func updateUIView(_ bar: UISearchBar, context: Context) {
		context.coordinator.props = props
		bar.placeholder = props.placeholder
		// Set on both the bar and its text field, not tidied down to one: a test
		// needs the bar's own identifier to scope a query for its Cancel button
		// (`app.otherElements[id].buttons[...]`) and the text field's identifier
		// to find the field itself (`app.searchFields[id]`) -- two different
		// XCUITest element types, each keyed off this same testID.
		bar.accessibilityIdentifier = props.testID
		bar.searchTextField.accessibilityIdentifier = props.testID
		context.coordinator.updateCancelButton(on: bar, animated: false)
	}

	final class Coordinator: NSObject, UISearchBarDelegate {
		var props: CampusSearchBarProps

		init(props: CampusSearchBarProps) {
			self.props = props
		}

		/// Cancel is there whenever there is something to cancel: an active
		/// edit, or text left in the field after tapping away. `UISearchBar`
		/// itself never becomes first responder — it forwards focus to its
		/// inner text field — so that field is what must be asked.
		func updateCancelButton(on bar: UISearchBar, animated: Bool) {
			let hasText = !(bar.text ?? "").isEmpty
			bar.setShowsCancelButton(bar.searchTextField.isFirstResponder || hasText, animated: animated)
		}

		func searchBar(_ bar: UISearchBar, textDidChange text: String) {
			props.onTextChange(["value": text])
			updateCancelButton(on: bar, animated: true)
		}

		func searchBarTextDidBeginEditing(_ bar: UISearchBar) {
			updateCancelButton(on: bar, animated: true)
			props.onFocusChange(["value": true])
		}

		func searchBarTextDidEndEditing(_ bar: UISearchBar) {
			updateCancelButton(on: bar, animated: true)
			props.onFocusChange(["value": false])
		}

		func searchBarSearchButtonClicked(_ bar: UISearchBar) {
			bar.resignFirstResponder()
		}

		func searchBarCancelButtonClicked(_ bar: UISearchBar) {
			bar.text = ""
			bar.resignFirstResponder()
			bar.setShowsCancelButton(false, animated: true)
			props.onTextChange(["value": ""])
			props.onCancel()
		}
	}
}
