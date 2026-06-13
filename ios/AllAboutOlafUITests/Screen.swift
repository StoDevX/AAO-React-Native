import XCTest

/// A screen object wraps XCUIApplication interactions for a single screen,
/// providing a fluent API for navigation and assertions.
protocol Screen {
	var app: XCUIApplication { get }
}

extension Screen {
	/// Select the Browse tab, where the home grid of every feature now lives.
	/// The app launches into the Today tab, so any test that drives the grid
	/// must switch to Browse first. Tapping an already-active tab is harmless
	/// (it pops that tab's stack back to the grid), so this is safe to call
	/// repeatedly.
	@discardableResult
	func selectBrowseTab() -> Self {
		let browse = app.tabButton(TestIdentifiers.Tabs.browse)
		if browse.waitForExistence(timeout: 30) {
			browse.tap()
		}
		return self
	}

	/// Assert that the home screen is visible.
	@discardableResult
	func waitForHomescreen() -> Self {
		selectBrowseTab()
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")
		return self
	}

	/// Tap a home-screen button and wait for the home screen to disappear.
	@discardableResult
	func navigateFromHome(to button: String) -> Self {
		selectBrowseTab()
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
		app.buttons[button].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
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
