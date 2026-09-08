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
		bar.searchTextField.heightAnchor.constraint(equalToConstant: fieldHeight).isActive = true
		return bar
	}

	func updateUIView(_ bar: UISearchBar, context: Context) {
		context.coordinator.props = props
		bar.placeholder = props.placeholder
		bar.accessibilityIdentifier = props.testID
		bar.searchTextField.accessibilityIdentifier = props.testID
		if bar.text != props.text {
			bar.text = props.text
		}
		context.coordinator.updateCancelButton(on: bar, animated: false)
	}

	final class Coordinator: NSObject, UISearchBarDelegate {
		var props: CampusSearchBarProps

		init(props: CampusSearchBarProps) {
			self.props = props
		}

		/// Cancel is there whenever there is something to cancel: an active
		/// edit, or text left in the field after tapping away.
		func updateCancelButton(on bar: UISearchBar, animated: Bool) {
			let hasText = !(bar.text ?? "").isEmpty
			bar.setShowsCancelButton(bar.isFirstResponder || hasText, animated: animated)
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
