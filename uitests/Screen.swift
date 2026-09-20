import XCTest

/// A screen object wraps XCUIApplication interactions for a single screen,
/// providing a fluent API for navigation and assertions.
protocol Screen {
	var app: XCUIApplication { get }
}

/// How long a `capture` or `captureAccessibilityTree` attachment survives.
///
/// Run by hand, a screenshot is taken to be looked at, and a passing run is
/// exactly the one whose screenshots are worth keeping. In CI nobody opens a
/// passing run's attachments, and keeping them bloats the result bundle every
/// shard uploads. The workflow sets `TEST_RUNNER_CI`; xcodebuild strips the
/// prefix on its way to the runner.
private let captureLifetime: XCTAttachment.Lifetime = isCI ? .deleteOnSuccess : .keepAlways

/// Whether `CI` holds a truthy value, the way CI services set it: present,
/// and neither empty, `0` nor `false`.
private var isCI: Bool {
	guard let value = ProcessInfo.processInfo.environment["CI"]?.lowercased() else {
		return false
	}
	return !["", "0", "false"].contains(value)
}

extension Screen {
	/// Assert that the home screen is visible.
	@discardableResult
	func waitForHomescreen() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")
		return self
	}

	/// Tap a home-screen tile and wait for the home screen to disappear.
	///
	/// The tap is retried, because it can be dropped. A home-screen tile is a
	/// SwiftUI button that becomes hittable as soon as its host mounts, while
	/// its action has to reach JavaScript to push the next screen. A press
	/// synthesized in between lands natively and nothing happens: the element
	/// is found, the event is delivered, and the app stays put.
	///
	/// Retrying is the fix rather than a longer timeout, since a dropped tap is
	/// not a slow one -- waiting on it achieves nothing.
	@discardableResult
	func navigateFromHome(to button: String) -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible before navigating to \(button)")

		let tile = app.buttons[button].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(button) button should exist on the home screen")

		for attempt in 1...3 {
			tile.tap()
			if homescreen.waitForNonExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(attempt) on \(button) did not navigate; retrying"
			) { _ in }
		}

		XCTFail("Tapping \(button) never left the home screen")
		return self
	}

	/// Scrolls until `element` enters the accessibility tree.
	///
	/// SwiftUI's `Form` builds its rows lazily: anything below the fold is
	/// absent from the tree entirely, not merely offscreen, so a query for it
	/// fails outright rather than returning something unhittable.
	///
	/// `in` defaults to swiping `app` as a whole, which is right for a screen
	/// that is one scrollable region. A screen with its own named scroll
	/// container -- an `@expo/ui` `List`, say, sharing the screen with a
	/// floating control the swipe should not land on -- passes that container
	/// instead.
	///
	/// Good only for a screen with no keyboard up. A swipe spans the whole
	/// element it is sent to, so once a keyboard is showing it begins on the
	/// keyboard, the keyboard takes it, and this returns quietly having scrolled
	/// nothing. Every caller scrolls with the keyboard down; one that cannot
	/// wants the press-and-drag `CampusDictionaryScreen.revealInForm` uses.
	/// Swipe a scrolling container back to its top. `scrollUntilExists` only
	/// ever swipes one way, so a sweep meant to rule an element out has to
	/// start from the top or it never sees what is above it.
	@discardableResult
	func scrollToTop(_ container: XCUIElement, swipes: Int = 8) -> Self {
		for _ in 0..<swipes {
			container.swipeDown()
		}
		return self
	}

	@discardableResult
	func scrollUntilExists(_ element: XCUIElement, swipes: Int = 8, in container: XCUIElement? = nil) -> Self {
		let scrollTarget = container ?? app
		for _ in 0..<swipes {
			if element.exists { break }
			scrollTarget.swipeUp()
		}
		return self
	}

	/// Attach a screenshot of the whole screen to the test report, for as long
	/// as `captureLifetime` says.
	@discardableResult
	func capture(_ name: String) -> Self {
		let attachment = XCTAttachment(screenshot: app.screenshot())
		attachment.name = name
		attachment.lifetime = captureLifetime
		XCTContext.runActivity(named: name) { $0.add(attachment) }
		return self
	}

	/// Attach the current accessibility tree as text, for a query whose
	/// failure a screenshot can't explain -- fuzzy label matching, or an
	/// element the screenshot can't visually tell apart from a decoy. A bare
	/// `print` of `debugDescription` doesn't survive into the result bundle;
	/// this does.
	///
	/// Kept for as long as `captureLifetime` says, same as `capture`.
	@discardableResult
	func captureAccessibilityTree(_ name: String) -> Self {
		let treeDump = XCTAttachment(string: app.debugDescription)
		treeDump.name = name
		treeDump.lifetime = captureLifetime
		XCTContext.runActivity(named: name) { $0.add(treeDump) }
		return self
	}

	/// Pull the screen most of the way off with the back gesture, then let go
	/// without completing it, so the stack settles back where it started.
	///
	/// The drag stops short of half the width and moves slowly: UIKit decides an
	/// interactive pop on how far the finger travelled and how fast it was going
	/// when it lifted, so a slow release at a third of the way across is read as
	/// "put it back". Holding before the release is what drains the velocity --
	/// a fast flick from the same place would complete the pop instead.
	@discardableResult
	func cancelSwipeBack() -> Self {
		let edge = app.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.5))
		let partway = app.coordinate(withNormalizedOffset: CGVector(dx: 0.35, dy: 0.5))
		edge.press(
			forDuration: 0.2,
			thenDragTo: partway,
			withVelocity: .slow,
			thenHoldForDuration: 1.0)
		return self
	}

	/// Assert that a navigation-bar or section title is visible.
	@discardableResult
	func verifyTitle(_ title: String) -> Self {
		let titleElement = app.staticTexts[title].firstMatch
		XCTAssertTrue(
			titleElement.waitForExistence(timeout: 30),
			"\(title) title should be visible")
		return self
	}
}
