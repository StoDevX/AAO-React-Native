import ExpoModulesCore
import UIKit

public class DragToDismissModule: Module {
	public func definition() -> ModuleDefinition {
		Name("DragToDismiss")

		View(DragToDismissView.self) {
			Events("onDismiss", "onDragStart", "onDragCancel")
		}
	}
}

/// Lets a vertical drag carry its React Native children away, as Photos does
/// with a picture: the children follow the finger and the view's own
/// background fades with the distance. Let go far enough, or fast enough, and
/// the children slide off and the view reports a dismissal; otherwise they
/// spring back.
///
/// A zoomed picture pans rather than leaving: a scroll view that can scroll
/// takes the touch first, and a drag here starts only while any scroll view
/// inside sits at its smallest zoom besides. The scale is read here, not from
/// JavaScript, whose copy trails the pinch by a frame or more.
///
/// The children move by the layer's `sublayerTransform`, which React Native
/// never sets, so a re-render mid-drag cannot snap them back. The background
/// stays put because it belongs to the view's own layer, not a sublayer. It
/// fades through `layer.backgroundColor`: React Native's view keeps
/// `backgroundColor` as a value and paints the layer only when its props
/// change, so setting the view's `backgroundColor` draws nothing.
final class DragToDismissView: ExpoView {
	let onDismiss = EventDispatcher()
	let onDragStart = EventDispatcher()
	let onDragCancel = EventDispatcher()

	/// How far down or up a slow drag must go to dismiss, as a fraction of the view's height.
	private static let dismissDistance: CGFloat = 0.15
	/// How fast a flick must be moving, in points a second, to dismiss from any distance.
	private static let dismissSpeed: CGFloat = 800
	/// The distance, as a fraction of the view's height, at which the background has faded out.
	private static let fadeDistance: CGFloat = 0.5

	/// The background as React Native painted it, restored when a drag springs back.
	private var restingBackground: CGColor?
	private var dismissed = false

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		let recognizer = UIPanGestureRecognizer(target: self, action: #selector(dragged(_:)))
		addGestureRecognizer(recognizer)
	}

	override func gestureRecognizerShouldBegin(_ recognizer: UIGestureRecognizer) -> Bool {
		guard let pan = recognizer as? UIPanGestureRecognizer, !dismissed else {
			return super.gestureRecognizerShouldBegin(recognizer)
		}
		let velocity = pan.velocity(in: self)
		guard abs(velocity.y) > abs(velocity.x) else { return false }
		guard let scrollView = firstScrollView(in: self) else { return true }
		return scrollView.zoomScale <= scrollView.minimumZoomScale + 0.01
	}

	@objc private func dragged(_ pan: UIPanGestureRecognizer) {
		let offset = pan.translation(in: self).y
		switch pan.state {
		case .began:
			restingBackground = layer.backgroundColor
			move(to: offset)
			onDragStart()
		case .changed:
			move(to: offset)
		case .ended:
			let speed = pan.velocity(in: self).y
			let far = abs(offset) > bounds.height * Self.dismissDistance
			let flung = abs(speed) > Self.dismissSpeed && (speed > 0) == (offset > 0)
			if far || flung {
				slideAway(downward: offset != 0 ? offset > 0 : speed > 0)
			} else {
				springBack()
			}
		case .cancelled, .failed:
			springBack()
		default:
			break
		}
	}

	private func move(to offset: CGFloat) {
		CATransaction.begin()
		CATransaction.setDisableActions(true)
		layer.sublayerTransform = CATransform3DMakeTranslation(0, offset, 0)
		let faded = min(abs(offset) / (bounds.height * Self.fadeDistance), 1)
		layer.backgroundColor = background(fading: faded)
		CATransaction.commit()
	}

	private func springBack() {
		onDragCancel()
		animate(to: CATransform3DIdentity, background: restingBackground, duration: 0.35)
	}

	private func slideAway(downward: Bool) {
		dismissed = true
		let distance = bounds.height * (downward ? 1 : -1)
		animate(
			to: CATransform3DMakeTranslation(0, distance, 0), background: background(fading: 1),
			duration: 0.2
		) {
			self.onDismiss()
		}
	}

	/// The resting background with `faded`, from 0 to 1, of its alpha taken away.
	private func background(fading faded: CGFloat) -> CGColor? {
		guard let resting = restingBackground else { return nil }
		return resting.copy(alpha: resting.alpha * (1 - faded))
	}

	/// Both properties belong to the layer, which a UIView animation block does not animate.
	private func animate(
		to transform: CATransform3D, background: CGColor?, duration: CFTimeInterval,
		completion: (() -> Void)? = nil
	) {
		let presented = layer.presentation() ?? layer
		let move = CABasicAnimation(keyPath: "sublayerTransform")
		move.fromValue = presented.sublayerTransform
		move.toValue = transform
		let fade = CABasicAnimation(keyPath: "backgroundColor")
		fade.fromValue = presented.backgroundColor
		fade.toValue = background
		CATransaction.begin()
		CATransaction.setAnimationDuration(duration)
		CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: .easeOut))
		CATransaction.setCompletionBlock(completion)
		layer.sublayerTransform = transform
		layer.backgroundColor = background
		layer.add(move, forKey: "sublayerTransform")
		layer.add(fade, forKey: "backgroundColor")
		CATransaction.commit()
	}

	/// The first scroll view under `view`, breadth first, so the outermost one wins.
	private func firstScrollView(in view: UIView) -> UIScrollView? {
		var queue = view.subviews
		while !queue.isEmpty {
			let next = queue.removeFirst()
			if let scrollView = next as? UIScrollView { return scrollView }
			queue.append(contentsOf: next.subviews)
		}
		return nil
	}
}
