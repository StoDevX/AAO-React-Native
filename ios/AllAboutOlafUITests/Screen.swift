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
		if browse.waitForExistence(timeout: 30), browse.waitForHittable(timeout: 30) {
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

		let tile = app.buttons[button].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(button) tile should be present on the home grid")

		// Cold-start hardening. Three things can go wrong on a freshly booted
		// simulator: the grid renders before it is hittable; the first tap is
		// dropped while the JS thread finishes mounting the Browse stack; and
		// URL tiles (e.g. Campus Map) open an SFSafariViewController that can
		// take many seconds to cover the grid. Each attempt only taps once the
		// tile is hittable, then waits generously for the grid to go away. If
		// the tile is no longer hittable a screen is already covering it, so we
		// just keep waiting for the grid to disappear.
		for _ in 0..<3 {
			if tile.waitForHittable(timeout: 20) {
				tile.tap()
			}
			if homescreen.waitForNonExistence(timeout: 30) {
				return self
			}
		}
		XCTFail("Tapping \(button) did not leave the home grid")
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
