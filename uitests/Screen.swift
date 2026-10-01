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

	/// Open a route by deep link and wait for `mounted`, an element only that
	/// route's screen draws.
	///
	/// `route` is an Expo Router path, which drops route groups:
	/// `app/(home)/Calendar.tsx` is `/Calendar`. `XCUIApplication.open(_:)`
	/// relaunches the app and raises no "Open in…?" sheet, unlike `simctl
	/// openurl`.
	///
	/// The wait is what makes this safe: the relaunched app has no home screen
	/// while it is still blank, so "Home has gone" is true before anything has
	/// mounted, and a test's first action could land on nothing.
	@discardableResult
	func open(route: String, mountedWhen mounted: XCUIElement, timeout: TimeInterval = 30) -> Self {
		// No wait for Home to go: `mounted` belongs to the route alone, and
		// each wait costs a second of polling.
		app.open(URL(string: "AllAboutOlaf://\(route)")!)
		XCTAssertTrue(
			mounted.waitForExistence(timeout: timeout),
			"\(route) should mount \(mounted)")
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

	/// Go back one screen with the navigation bar's back button. iOS 27 can keep
	/// more than one navigation bar in the tree, and a bar need not have a title to
	/// pick it out by, so this takes the back button a tap can reach: the covered
	/// bars' buttons are not hittable.
	@discardableResult
	func goBack() -> Self {
		let backs = app.navigationBars.buttons.matching(identifier: TestIdentifiers.Navigation.systemBackButton)
		let reachable = { backs.allElementsBoundByIndex.first { $0.isHittable } }
		let offered = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in reachable() != nil }, object: nil)],
			timeout: 10)
		XCTAssertEqual(offered, .completed, "the screen should offer a way back")
		reachable()?.tap()
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
