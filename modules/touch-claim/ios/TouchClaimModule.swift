import ExpoModulesCore
import UIKit

public class TouchClaimModule: Module {
	public func definition() -> ModuleDefinition {
		Name("TouchClaim")

		View(TouchClaimView.self)
	}
}

/// Keeps the sheet or scroll view around its children from taking a touch on
/// them as a drag.
///
/// A touch on a sheet's content is the sheet's pan to take, and a scroll
/// view's to scroll. They begin once the finger has moved a few points, which
/// cancels React Native's own responder, so a gesture that turns the children
/// loses its touch. This view adds a recognizer that begins the moment a finger
/// lands, so the pans, which have not yet begun, are prevented. It does not
/// cancel the touch, and React Native's touch handler is never prevented by
/// another recognizer, so the children keep receiving it.
final class TouchClaimView: ExpoView {
	private let recognizer = TouchDownRecognizer()

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		recognizer.cancelsTouchesInView = false
		recognizer.delaysTouchesBegan = false
		recognizer.delaysTouchesEnded = false
		addGestureRecognizer(recognizer)
	}
}

/// Begins at touch-down and ends at touch-up, with no distance to cover first.
private final class TouchDownRecognizer: UIGestureRecognizer {
	override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
		if state == .possible {
			state = .began
		}
	}

	override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
		state = .ended
	}

	override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
		state = .cancelled
	}
}
