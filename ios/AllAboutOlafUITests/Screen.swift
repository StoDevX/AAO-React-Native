import XCTest

/// A screen object wraps `XCUIApplication` interactions for a single screen,
/// providing a fluent API for navigation and assertions.
///
/// Every method returns `Self` (marked `@discardableResult`) so callers can
/// chain actions into a readable sequence:
///
///     SISScreen(app: app)
///         .navigate()
///         .acceptAcknowledgement()
///         .checkBalancesVisible()
///
/// XCTest assertions live exclusively inside Screen objects so that the
/// test files themselves contain no `XCTAssert*` calls. This isolates all
/// XCTest dependencies for a future migration to Swift Testing.
@MainActor
protocol Screen {
	var app: XCUIApplication { get }
}

extension Screen {

	// MARK: - Assertion Helpers

	/// Assert that an element exists within the given timeout.
	func assertExists(
		_ element: XCUIElement,
		timeout: TimeInterval = 30,
		_ message: String
	) {
		XCTAssertTrue(
			element.waitForExistence(timeout: timeout),
			message)
	}

	/// Assert that an element disappears within the given timeout.
	func assertNotExists(
		_ element: XCUIElement,
		timeout: TimeInterval = 30,
		_ message: String
	) {
		XCTAssertTrue(
			element.waitForNonExistence(timeout: timeout),
			message)
	}

	// MARK: - Home Screen Navigation

	/// Assert that the home screen is visible.
	@discardableResult
	func waitForHomescreen() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible")
		return self
	}

	/// Tap a home-screen button and wait for the home screen to disappear.
	@discardableResult
	func navigateFromHome(to button: String) -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible before navigating to \(button)")
		app.buttons[button].firstMatch.tap()
		assertNotExists(homescreen, "Home screen should disappear after tapping \(button)")
		return self
	}

	/// Assert that a navigation-bar or section title is visible.
	@discardableResult
	func verifyTitle(_ title: String) -> Self {
		let titleElement = app.staticTexts[title].firstMatch
		assertExists(titleElement, "\(title) title should be visible")
		return self
	}

	// MARK: - Shared Tab Helpers

	/// Verify that tab buttons exist for each label, optionally tapping each one.
	@discardableResult
	func checkTabButtons(_ tabs: [String], tap: Bool = false) -> Self {
		for tab in tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabButton = app.tabButton(tab)
				assertExists(tabButton, "\(tab) tab should be visible")
				if tap {
					tabButton.tap()
				}
			}
		}
		return self
	}

	// MARK: - Safari Dismiss

	/// Dismiss an SFSafariViewController and verify the home screen returns.
	///
	/// Safari + WebKit initialization under iOS 26 simulator load is highly
	/// variable (observed 1s to >10s in CI), so wait generously.
	@discardableResult
	func dismissSafariAndReturn() -> Self {
		let doneButton = app.buttons["Done"]
		assertExists(doneButton, "Safari Done button should appear")
		doneButton.tap()

		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible after dismissing Safari")
		return self
	}
}
