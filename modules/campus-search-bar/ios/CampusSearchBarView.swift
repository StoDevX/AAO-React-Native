import ExpoModulesCore
import SwiftUI
import UIKit

/// Apple Maps' search field is 44pt tall. UIKit's default is shorter, so the
/// height is pinned rather than inherited. The picker's margins, the
/// collapsed detent's height, and `CarletonMapScreen.swift`'s scale
/// derivation are all sized against this constant.
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
		// Set on both the bar and its text field, not tidied down to one: a test
		// needs the bar's own identifier to scope a query for its Cancel button
		// (`app.otherElements[id].buttons[...]`) and the text field's identifier
		// to find the field itself (`app.searchFields[id]`) -- two different
		// XCUITest element types, each keyed off this same testID.
		bar.accessibilityIdentifier = props.testID
		bar.searchTextField.accessibilityIdentifier = props.testID
		// `props.text` can be an echo of a keystroke this coordinator already
		// sent, arriving late. If it matches a still-pending sent value, drop
		// that value (and anything queued before it, now unreachable) and leave
		// the field alone; otherwise it is a genuine JS-originated change — a
		// paste, a cleared search, a tapped suggestion — and must be written,
		// which also means anything still in flight is now stale and moot.
		if let echoedIndex = context.coordinator.pendingSent.firstIndex(of: props.text) {
			context.coordinator.pendingSent.removeFirst(echoedIndex + 1)
		} else {
			if bar.text != props.text {
				bar.text = props.text
			}
			context.coordinator.pendingSent.removeAll()
		}
		context.coordinator.updateCancelButton(on: bar, animated: false)
	}

	final class Coordinator: NSObject, UISearchBarDelegate {
		var props: CampusSearchBarProps
		/// Values sent to JS via `onTextChange` that have not yet come back
		/// through `props.text`, oldest first. A single remembered value is not
		/// enough: two keystrokes sent before either echoes back need their own
		/// slots, or the second keystroke's echo is mistaken for the first's and
		/// the first is dropped. Capped so a JS side that never echoes — a bug
		/// on that end — cannot grow this without bound.
		var pendingSent: [String] = []

		init(props: CampusSearchBarProps) {
			self.props = props
		}

		/// Queues a value this coordinator is about to report to JS, so its
		/// eventual echo through `props.text` can be told apart from a change
		/// JS made on its own.
		func recordSent(_ text: String) {
			pendingSent.append(text)
			if pendingSent.count > 32 {
				pendingSent.removeFirst()
			}
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
			recordSent(text)
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
			recordSent("")
			props.onTextChange(["value": ""])
			props.onCancel()
		}
	}
}
