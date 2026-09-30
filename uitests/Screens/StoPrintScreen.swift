import XCTest

struct StoPrintScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Print Jobs"]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/PrintJobs", mountedWhen: mounted)
	}

	@discardableResult
	func checkNotLoggedIn() -> Self {
		let notLoggedIn = app.staticTexts[TestIdentifiers.StoPrint.notLoggedIn].firstMatch
		XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
		return self
	}
}
