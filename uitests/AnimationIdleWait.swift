import Foundation
import ObjectiveC.runtime

/// Before every synthesized event XCUITest waits for the app to be idle: its
/// main run loop, and then its animations. This turns off the second wait,
/// for the whole run, and keeps the first.
///
/// The first toolbar menu a freshly launched app opens morphs out of its
/// button (UIKit's Liquid Glass morph, `_UIMorphAnimationContainerView`). Now
/// and then, on CI, that morph is never torn down: its layers keep
/// `CAMatchMoveAnimation`s of infinite duration attached, the menu's
/// presentation never reports that it finished, and XCUITest's "animations
/// idle" request never gets an answer. The next tap then waits until the
/// two-minute limit stops the test. The calendar filter menu and the
/// newspaper's More menu hung this way in two runs of three; every later menu
/// in the same app process opened normally. Nothing in the app is involved --
/// the stuck layers are all UIKit's -- so the wait is what has to give.
///
/// Screen objects already wait for what they need (an element existing, being
/// hittable, a label changing), so a tap that no longer waits for animations
/// still waits for its target.
///
/// `XCUIApplicationProcess` is private to XCTest. The swap checks the method's
/// type encoding first, and when this Xcode has no method of the expected
/// shape it changes nothing and says so in the log, so a new Xcode cannot crash
/// the runner -- the tests just wait for animations again.
enum AnimationIdleWait {
	private static var installed = false

	private typealias WithActivity = @convention(c) (AnyObject, Selector, Bool, AnyObject?, Bool) -> Void
	private typealias PreEventOnly = @convention(c) (AnyObject, Selector, Bool, Bool) -> Void

	static func skip() {
		guard !installed else { return }
		installed = true

		guard let process: AnyClass = NSClassFromString("XCUIApplicationProcess") else {
			return report("XCUIApplicationProcess is missing")
		}

		let withActivity = NSSelectorFromString("waitForQuiescenceIncludingAnimationsIdle:usingActivity:isPreEvent:")
		if let method = class_getInstanceMethod(process, withActivity), ["v@:B@B", "v@:c@c"].contains(shape(of: method)) {
			let original = unsafeBitCast(method_getImplementation(method), to: WithActivity.self)
			let replacement: @convention(block) (AnyObject, Bool, AnyObject?, Bool) -> Void = {
				target, _, activity, isPreEvent in
				original(target, withActivity, false, activity, isPreEvent)
			}
			method_setImplementation(method, imp_implementationWithBlock(replacement))
			return
		}

		let preEventOnly = NSSelectorFromString("waitForQuiescenceIncludingAnimationsIdle:isPreEvent:")
		if let method = class_getInstanceMethod(process, preEventOnly), ["v@:BB", "v@:cc"].contains(shape(of: method)) {
			let original = unsafeBitCast(method_getImplementation(method), to: PreEventOnly.self)
			let replacement: @convention(block) (AnyObject, Bool, Bool) -> Void = { target, _, isPreEvent in
				original(target, preEventOnly, false, isPreEvent)
			}
			method_setImplementation(method, imp_implementationWithBlock(replacement))
			return
		}

		report("no waitForQuiescenceIncludingAnimationsIdle method of a known shape")
	}

	/// The method's type encoding without its frame offsets: "v@:B@B" for a
	/// void method taking a BOOL, an object and a BOOL ("c" for BOOL on x86_64).
	private static func shape(of method: Method) -> String? {
		guard let encoding = method_getTypeEncoding(method) else { return nil }
		return String(cString: encoding).filter { !$0.isNumber }
	}

	private static func report(_ reason: String) {
		NSLog("AnimationIdleWait: still waiting for animations idle before each event: %@", reason as NSString)
	}
}
