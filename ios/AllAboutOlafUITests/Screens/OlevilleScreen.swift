import XCTest

struct OlevilleScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.oleville)
	}

	/// Dismiss the SFSafariViewController that opens for Oleville.
	/// Safari + WebKit initialization under iOS 26 simulator load is highly
	/// variable (observed 1s to >10s in CI), so wait generously.
	@discardableResult
	func dismissSafari() -> Self {
		let doneButton = app.buttons["Done"]
		XCTAssertTrue(
			doneButton.waitForExistence(timeout: 30),
			"Safari Done button should appear once Oleville loads")
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
