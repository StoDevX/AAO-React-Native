import XCTest

struct CampusMapScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		selectBrowseTab()
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		let tile = app.buttons[TestIdentifiers.Buttons.campusMap].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"Campus Map tile should be present on the home grid")

		// Campus Map is a URL tile: tapping it opens an in-app browser *over* the
		// grid instead of pushing a screen, so the grid stays in the hierarchy.
		// Success is the browser appearing (its "Done" button), not the grid
		// disappearing. Retry the tap for cold-start robustness.
		let doneButton = app.buttons["Done"]
		for _ in 0..<3 {
			if tile.waitForHittable(timeout: 20) {
				tile.tap()
			}
			if doneButton.waitForExistence(timeout: 30) {
				return self
			}
		}
		XCTFail("Campus Map did not open the in-app browser")
		return self
	}

	/// Dismiss the SFSafariViewController that opens for the campus map.
	/// Safari + WebKit initialization under iOS 26 simulator load is highly
	/// variable (observed 1s to >10s in CI), so wait generously.
	@discardableResult
	func dismissSafari() -> Self {
		let doneButton = app.buttons["Done"]
		XCTAssertTrue(
			doneButton.waitForExistence(timeout: 30),
			"Safari Done button should appear once the map loads")
		doneButton.tap()
		return self
	}

	@discardableResult
	func checkReturnedToHomescreen() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
		return self
	}
}
