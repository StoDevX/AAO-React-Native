import ExpoModulesCore
import UIKit

/// DebugSwift's controls, for JavaScript to reach.
///
/// DebugSwift is a Swift package linked into the app target in Debug builds
/// only, and a pod cannot import it, so AppDelegate fills in these hooks and
/// calls `launch()` (see plugins/with-debug-swift.ts). They stay nil in a
/// Release build, and in a UI test or chaos launch.
///
/// The hooks are written once in `didFinishLaunchingWithOptions`, before
/// JavaScript loads, and only read after that.
public enum DebugTools {
	nonisolated(unsafe) public static var setUp: (@MainActor () -> Void)?
	nonisolated(unsafe) public static var makeDebugger: (@MainActor () -> UIViewController)?
	nonisolated(unsafe) public static var debuggerWillPresent: (@MainActor () -> Void)?
	nonisolated(unsafe) public static var debuggerDidDismiss: (@MainActor () -> Void)?
	nonisolated(unsafe) public static var showFloatingButton: (@MainActor () -> Void)?
	nonisolated(unsafe) public static var hideFloatingButton: (@MainActor () -> Void)?

	/// The Developer screen's switch. Kept here rather than with JavaScript's
	/// settings because `launch()` reads it before JavaScript has loaded.
	private static let enabledKey = "DebugSwiftEnabled"

	/// Whether DebugSwift has instrumented the app. It cannot undo that, so
	/// this stays true until the app quits, whatever the switch says.
	@MainActor static private(set) var isRunning = false

	static var isAvailable: Bool {
		setUp != nil
	}

	static var isEnabled: Bool {
		UserDefaults.standard.bool(forKey: enabledKey)
	}

	/// Set DebugSwift up at launch if the switch was left on, so it sees every
	/// request from the first.
	@MainActor public static func launch() {
		if isEnabled {
			start()
		}
	}

	/// Turning DebugSwift on sets it up at once, so it sees requests from now
	/// on. Turning it off hides its button; the rest waits for a relaunch.
	@MainActor static func setEnabled(_ enabled: Bool) {
		UserDefaults.standard.set(enabled, forKey: enabledKey)
		if enabled {
			start()
		} else if isRunning {
			hideFloatingButton?()
		}
	}

	@MainActor private static func start() {
		guard !isRunning, let setUp else {
			return
		}
		setUp()
		isRunning = true
	}
}

public class DebugToolsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("DebugTools")

		Function("isAvailable") {
			DebugTools.isAvailable
		}

		Function("isEnabled") {
			DebugTools.isEnabled
		}

		AsyncFunction("isRunning") {
			MainActor.assumeIsolated {
				DebugTools.isRunning
			}
		}.runOnQueue(.main)

		AsyncFunction("setEnabled") { (enabled: Bool) in
			MainActor.assumeIsolated {
				DebugTools.setEnabled(enabled)
			}
		}.runOnQueue(.main)

		AsyncFunction("openDebugger") {
			MainActor.assumeIsolated {
				guard DebugTools.isRunning else {
					return
				}
				DebuggerPresenter.present()
			}
		}.runOnQueue(.main)

		AsyncFunction("setFloatingButtonEnabled") { (enabled: Bool, lightImage: String?, darkImage: String?) in
			MainActor.assumeIsolated {
				guard DebugTools.isRunning else {
					return
				}
				guard enabled else {
					DebugTools.hideFloatingButton?()
					return
				}
				DebugTools.showFloatingButton?()
				if let image = FloatingButtonStyle.image(light: lightImage, dark: darkImage) {
					FloatingButtonStyle.apply(image)
				}
			}
		}.runOnQueue(.main)
	}
}

/// Presents DebugSwift's tools as a sheet over the app.
///
/// Through `debugViewController()`, which DebugSwift offers for an entry point
/// of an app's own, rather than `App.presentDebugger()`: that one belongs to
/// the floating button, and puts the button back on screen when it closes,
/// whatever the Developer screen's switch says. The will-present and
/// did-dismiss calls hide the button while the sheet is up and bring it back
/// only if it was showing.
@MainActor
enum DebuggerPresenter {
	/// Calls did-dismiss once the reader swipes the sheet away.
	private final class DismissalObserver: NSObject, UIAdaptivePresentationControllerDelegate {
		func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
			MainActor.assumeIsolated {
				DebugTools.debuggerDidDismiss?()
			}
		}
	}

	private static let observer = DismissalObserver()

	static func present() {
		guard let makeDebugger = DebugTools.makeDebugger, let presenter = topViewController() else {
			return
		}
		let debugger = makeDebugger()
		debugger.modalPresentationStyle = .pageSheet
		debugger.sheetPresentationController?.prefersGrabberVisible = true
		debugger.presentationController?.delegate = observer
		DebugTools.debuggerWillPresent?()
		presenter.present(debugger, animated: true)
	}

	/// What is on screen in the app's own window, over which the sheet goes.
	private static func topViewController() -> UIViewController? {
		let window = UIApplication.shared.connectedScenes
			.compactMap { $0 as? UIWindowScene }
			.flatMap(\.windows)
			.first { $0.isKeyWindow }
		var top = window?.rootViewController
		while let presented = top?.presentedViewController {
			top = presented
		}
		return top
	}
}

/// Draws DebugSwift's floating button as the app icon, filling the 40pt the
/// button already takes up, in place of its 18pt black ball. The previews
/// carry the icon's rounded-square shape in their alpha, so the image is drawn
/// whole: a circle would cut the corners of the drawing.
///
/// DebugSwift has no API for this, and the request count it prints on the ball
/// is an internal label, rewritten on every request. So this finds the button
/// by its class name and hides the ball, which holds that count and the emoji
/// that float up from it on each request. Should an update rename the class,
/// the button is left as DebugSwift draws it.
@MainActor
enum FloatingButtonStyle {
	/// The icon this adds, told apart from DebugSwift's own subviews by type.
	private final class IconView: UIImageView {}

	private static let buttonClassName = "FloatBallView"

	/// `light` and `dark` as one image that follows the appearance, from file
	/// URLs. Nil if `light` does not load.
	static func image(light: String?, dark: String?) -> UIImage? {
		guard let lightImage = load(light) else {
			return nil
		}
		guard let darkImage = load(dark) else {
			return lightImage
		}
		let asset = UIImageAsset()
		asset.register(lightImage, with: UITraitCollection(userInterfaceStyle: .light))
		asset.register(darkImage, with: UITraitCollection(userInterfaceStyle: .dark))
		return asset.image(with: UITraitCollection.current)
	}

	/// Restyle the button once it is on screen. DebugSwift adds it a second
	/// after `show()`, so this looks for it for a few seconds before giving up.
	static func apply(_ image: UIImage, attemptsLeft: Int = 30) {
		guard let button = findButton() else {
			guard attemptsLeft > 0 else {
				return
			}
			Task { @MainActor in
				try? await Task.sleep(for: .milliseconds(100))
				apply(image, attemptsLeft: attemptsLeft - 1)
			}
			return
		}
		restyle(button, with: image)
	}

	private static func load(_ uri: String?) -> UIImage? {
		guard let uri, let url = URL(string: uri), url.isFileURL else {
			return nil
		}
		return UIImage(contentsOfFile: url.path)
	}

	private static func findButton() -> UIView? {
		let windows = UIApplication.shared.connectedScenes
			.compactMap { $0 as? UIWindowScene }
			.flatMap(\.windows)
		for window in windows {
			if let button = firstButton(in: window) {
				return button
			}
		}
		return nil
	}

	private static func firstButton(in view: UIView) -> UIView? {
		if String(describing: type(of: view)) == buttonClassName {
			return view
		}
		for subview in view.subviews {
			if let button = firstButton(in: subview) {
				return button
			}
		}
		return nil
	}

	/// The button is one instance for the life of the app, so this holds when
	/// DebugSwift hides and shows it again.
	private static func restyle(_ button: UIView, with image: UIImage) {
		let icon = button.subviews.lazy.compactMap { $0 as? IconView }.first ?? {
			let icon = IconView()
			icon.contentMode = .scaleAspectFit
			icon.autoresizingMask = [.flexibleWidth, .flexibleHeight]
			button.addSubview(icon)
			return icon
		}()
		for subview in button.subviews where subview !== icon {
			subview.isHidden = true
		}
		icon.image = image
		icon.frame = button.bounds

		button.isAccessibilityElement = true
		button.accessibilityLabel = "DebugSwift"
		button.accessibilityTraits = .button
	}
}
