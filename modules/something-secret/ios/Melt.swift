import SwiftUI
import UIKit

/// Melts the whole app away in a window above everything, nav bars included, and later pours it
/// back. Only one melt window exists at a time.
@MainActor
enum Melt {
	static let duration: Double = 3
	static let fade: Double = 0.3
	/// Kept alive while it shows; a window with no owner is removed at once.
	private static var window: UIWindow?

	private static var scenes: [UIWindowScene] {
		UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
	}

	/// The scene in use, for a melt, which only makes sense on screen.
	private static var activeScene: UIWindowScene? {
		scenes.first { $0.activationState == .foregroundActive }
	}

	/// The app's own window, beneath any melt window.
	private static func appWindow(in scene: UIWindowScene) -> UIWindow? {
		scene.windows.first { $0 !== window && $0.windowLevel == .normal && !$0.isHidden }
	}

	private static func snapshot(of appWindow: UIWindow, afterScreenUpdates: Bool) -> UIImage {
		UIGraphicsImageRenderer(bounds: appWindow.bounds).image { _ in
			appWindow.drawHierarchy(in: appWindow.bounds, afterScreenUpdates: afterScreenUpdates)
		}
	}

	private static func show(_ view: some View, in scene: UIWindowScene) -> UIWindow {
		let overlay = UIWindow(windowScene: scene)
		overlay.windowLevel = .alert + 1
		overlay.rootViewController = UIHostingController(rootView: view)
		overlay.isHidden = false
		window = overlay
		return overlay
	}

	private static func remove(_ overlay: UIWindow) {
		overlay.isHidden = true
		window = nil
	}

	/// Melts the app to black, then fades the melt window out to whatever is beneath.
	static func run() async {
		guard window == nil, let scene = activeScene, let appWindow = appWindow(in: scene) else { return }
		let image = snapshot(of: appWindow, afterScreenUpdates: false)
		await withCheckedContinuation { finished in
			_ = show(
				MeltView(snapshot: image, duration: duration, reversed: false) { finished.resume() },
				in: scene)
		}
		guard let overlay = window else { return }
		_ = await UIView.animate(withDuration: fade) { overlay.alpha = 0 }
		remove(overlay)
	}

	/// Covers everything in black, so the app can change beneath before a rewind. Any scene will
	/// do: the app may be ending a lockout as it comes back to the foreground.
	static func cover() async {
		guard window == nil, let scene = activeScene ?? scenes.first else { return }
		_ = show(Color.black.ignoresSafeArea(), in: scene)
	}

	/// Pours the app as it now is back up out of the black cover, then removes the cover. The
	/// cover always comes down, rewind or not: one left up would hide the app until it is quit.
	static func rewind() async {
		guard let overlay = window else { return }
		guard let scene = overlay.windowScene, let appWindow = appWindow(in: scene) else {
			remove(overlay)
			return
		}
		// Time for React Native to draw the app without the dead screen.
		try? await Task.sleep(for: .milliseconds(300))
		let image = snapshot(of: appWindow, afterScreenUpdates: true)
		await withCheckedContinuation { finished in
			overlay.rootViewController = UIHostingController(
				rootView: MeltView(snapshot: image, duration: duration, reversed: true) { finished.resume() })
		}
		remove(overlay)
	}
}
