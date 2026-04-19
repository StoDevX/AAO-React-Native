import XCTest

class ModuleOlevilleTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Oleville"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		// dismiss SFSafariViewController. Safari + WebKit initialization
		// under iOS 26 simulator load is highly variable (observed 1s to
		// >10s in CI), so wait generously before tapping Done.
		let doneButton = app.buttons["Done"]
		XCTAssertTrue(
			doneButton.waitForExistence(timeout: 30),
			"Safari Done button should appear once Oleville loads")
		doneButton.tap()

		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
	}
}
