import ExpoModulesCore
import UIKit

public class DoubleTapModule: Module {
	public func definition() -> ModuleDefinition {
		Name("DoubleTap")

		View(DoubleTapView.self) {
			Events("onDoubleTap")
		}
	}
}

/// Reports a double tap anywhere on its React Native children, and where it
/// landed in the view's own coordinates.
///
/// UIKit models a double tap as one touch whose tap count rises to 2, and
/// React Native's touch handler cannot follow it: the handler is reset only
/// when the run loop next turns, so a second touch-down that arrives before
/// then is never handed to it and JavaScript sees one press. UIKit's own tap
/// recognizer counts the taps itself.
final class DoubleTapView: ExpoView {
	let onDoubleTap = EventDispatcher()

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		let recognizer = UITapGestureRecognizer(target: self, action: #selector(doubleTapped(_:)))
		recognizer.numberOfTapsRequired = 2
		addGestureRecognizer(recognizer)
	}

	@objc private func doubleTapped(_ recognizer: UITapGestureRecognizer) {
		let point = recognizer.location(in: self)
		onDoubleTap(["x": point.x, "y": point.y])
	}
}
