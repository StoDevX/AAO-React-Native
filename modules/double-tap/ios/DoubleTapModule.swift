import ExpoModulesCore
import UIKit

public class DoubleTapModule: Module {
	public func definition() -> ModuleDefinition {
		Name("DoubleTap")

		View(DoubleTapView.self) {
			Events("onDoubleTap", "onSingleTap")
		}
	}
}

/// Reports a double tap anywhere on its React Native children, and where it
/// landed in the view's own coordinates, and a single tap that turned out not
/// to be the first of two.
///
/// UIKit models a double tap as one touch whose tap count rises to 2, and
/// React Native's touch handler cannot follow it: the handler is reset only
/// when the run loop next turns, so a second touch-down that arrives before
/// then is never handed to it and JavaScript sees one press. UIKit's own tap
/// recognizers count the taps themselves, and the single tap waits for the
/// double tap to fail, so a double tap never reports a single tap first.
final class DoubleTapView: ExpoView {
	let onDoubleTap = EventDispatcher()
	let onSingleTap = EventDispatcher()

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		let double = UITapGestureRecognizer(target: self, action: #selector(doubleTapped(_:)))
		double.numberOfTapsRequired = 2
		addGestureRecognizer(double)

		let single = UITapGestureRecognizer(target: self, action: #selector(singleTapped(_:)))
		single.require(toFail: double)
		addGestureRecognizer(single)
	}

	@objc private func doubleTapped(_ recognizer: UITapGestureRecognizer) {
		let point = recognizer.location(in: self)
		onDoubleTap(["x": point.x, "y": point.y])
	}

	@objc private func singleTapped(_ recognizer: UITapGestureRecognizer) {
		onSingleTap()
	}
}
