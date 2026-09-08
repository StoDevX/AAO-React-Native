import ExpoModulesCore
import SwiftUI
import UIKit

/// Apple Maps' search field is 44pt tall. UIKit's default is shorter, so the
/// height is pinned rather than inherited.
private let fieldHeight: CGFloat = 44

final class CampusSearchBarProps: ExpoSwiftUI.ViewProps {
	@Field var placeholder: String = ""
	@Field var text: String = ""
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
		// Zero: the sheet content supplies the 16pt margins, so the bar must
		// not add its own.
		bar.directionalLayoutMargins = .zero
		// Required would fight UISearchBar's own (private, undocumented) layout
		// of the text field within the bar; 999 lets that layout win instead of
		// throwing constraint-conflict warnings, at the cost of possibly falling
		// short of 44pt — Task 5 measures the resulting height.
		let textFieldHeight = bar.searchTextField.heightAnchor.constraint(equalToConstant: fieldHeight)
		textFieldHeight.priority = UILayoutPriority(999)
		textFieldHeight.isActive = true
		return bar
	}

	func updateUIView(_ bar: UISearchBar, context: Context) {
		context.coordinator.props = props
		bar.placeholder = props.placeholder
		bar.accessibilityIdentifier = props.testID
		bar.searchTextField.accessibilityIdentifier = props.testID
		// `props.text` after a keystroke is just JS echoing what the user typed,
		// arriving one round-trip late. Writing it back would overwrite whatever
		// the user has typed since, so only text JS actually originated (a value
		// this coordinator did not just send) is allowed to move the caret.
		if props.text != context.coordinator.lastSentText, bar.text != props.text {
			bar.text = props.text
		}
		context.coordinator.updateCancelButton(on: bar, animated: false)
	}

	final class Coordinator: NSObject, UISearchBarDelegate {
		var props: CampusSearchBarProps
		/// The last value this coordinator sent to JS via `onTextChange`, so
		/// `updateUIView` can tell "JS echoing what the user just typed" apart
		/// from "JS actually changed the text" and only act on the latter.
		var lastSentText: String?

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
			lastSentText = text
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
			lastSentText = ""
			props.onTextChange(["value": ""])
			props.onCancel()
		}
	}
}
