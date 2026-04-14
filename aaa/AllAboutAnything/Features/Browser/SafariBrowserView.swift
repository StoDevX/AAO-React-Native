import SafariServices
import SwiftUI

struct SafariBrowserView: UIViewControllerRepresentable {
	let url: URL
	let onDismiss: () -> Void

	func makeUIViewController(context: Context) -> SFSafariViewController {
		let controller = SFSafariViewController(url: url)
		controller.dismissButtonStyle = .close
		controller.delegate = context.coordinator
		return controller
	}

	func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {
		// SFSafariViewController does not support URL updates after creation.
		// If the parent swaps the url, SwiftUI will rebuild the representable.
	}

	func makeCoordinator() -> Coordinator {
		Coordinator(onDismiss: onDismiss)
	}

	final class Coordinator: NSObject, SFSafariViewControllerDelegate {
		let onDismiss: () -> Void

		init(onDismiss: @escaping () -> Void) {
			self.onDismiss = onDismiss
		}

		func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
			onDismiss()
		}
	}
}
