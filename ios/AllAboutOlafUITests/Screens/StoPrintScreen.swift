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
		assertExists(notLoggedIn, "Not logged in message should be visible")
		return self
	}
}
