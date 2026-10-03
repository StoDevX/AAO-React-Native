import ExpoModulesCore
import UIKit

public class TouchClaimModule: Module {
	public func definition() -> ModuleDefinition {
		Name("TouchClaim")

		View(TouchClaimView.self) {}
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
/// cancel the touch. React Native's touch handler is prevented only by a
/// recognizer whose view lies outside its own, so this view has to sit inside
/// the view that handler is attached to, as it does under `RNHostView`. Put it
/// anywhere else and it would cancel React Native's touches along with the
/// pans.
///
/// Only a touch on the disc inscribed in the view claims: the corners of its
/// square leave the sheet and the scroll view their drag.
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
		guard state == .possible else { return }
		guard let view, let touch = touches.first, isOnDisc(touch.location(in: view), of: view.bounds) else {
			state = .failed
			return
		}
		state = .began
	}

	/// Whether `point` falls inside the circle that fits `bounds`.
	private func isOnDisc(_ point: CGPoint, of bounds: CGRect) -> Bool {
		let radius = min(bounds.width, bounds.height) / 2
		return hypot(point.x - bounds.midX, point.y - bounds.midY) <= radius
	}

	override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
		state = .ended
	}

	override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
		state = .cancelled
	}
}
