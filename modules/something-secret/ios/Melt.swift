import SwiftUI
import UIKit

/// Melts the whole app: snapshots the key window and shows the snapshot dripping away in a window
/// above everything, nav bars included, then fades that window out to whatever is beneath.
@MainActor
enum Melt {
	static let duration: Double = 3
	static let fade: Double = 0.3
	/// Kept alive while it shows; a window with no owner is removed at once.
	private static var window: UIWindow?

	static func run() async {
		guard
			window == nil,
			let scene = UIApplication.shared.connectedScenes
				.compactMap({ $0 as? UIWindowScene })
				.first(where: { $0.activationState == .foregroundActive }),
			let keyWindow = scene.keyWindow
		else { return }

		let snapshot = UIGraphicsImageRenderer(bounds: keyWindow.bounds).image { _ in
			keyWindow.drawHierarchy(in: keyWindow.bounds, afterScreenUpdates: false)
		}

		let overlay = UIWindow(windowScene: scene)
		overlay.windowLevel = .alert + 1
		overlay.rootViewController = UIHostingController(rootView: MeltView(snapshot: snapshot, duration: duration))
		overlay.isHidden = false
		window = overlay

		try? await Task.sleep(for: .seconds(duration))
		_ = await UIView.animate(withDuration: fade) { overlay.alpha = 0 }
		overlay.isHidden = true
		window = nil
	}
}
