import SafariServices
import SwiftUI

struct SafariBrowserView: UIViewControllerRepresentable {
	let url: URL

	func makeUIViewController(context: Context) -> SFSafariViewController {
		let controller = SFSafariViewController(url: url)
		controller.dismissButtonStyle = .close
		return controller
	}

	func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {
		// SFSafariViewController does not support URL updates after creation.
		// If the parent swaps the url, SwiftUI will rebuild the representable.
	}
}
