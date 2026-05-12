import XCTest

struct StoPrintScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.stoPrint)
	}

	@discardableResult
	func checkNotLoggedIn() -> Self {
		let notLoggedIn = app.staticTexts[TestIdentifiers.StoPrint.notLoggedIn].firstMatch
		XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
		return self
	}
}
