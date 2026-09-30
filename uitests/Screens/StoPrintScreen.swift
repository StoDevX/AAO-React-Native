import XCTest

struct StoPrintScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		open(route: "/PrintJobs", mountedWhen: app.navigationBars.firstMatch)
	}

	@discardableResult
	func checkNotLoggedIn() -> Self {
		let notLoggedIn = app.staticTexts[TestIdentifiers.StoPrint.notLoggedIn].firstMatch
		XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
		return self
	}
}
