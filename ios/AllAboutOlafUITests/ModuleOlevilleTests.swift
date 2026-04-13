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

		XCTAssertFalse(homescreen.exists)
	}

	func testReturnsToHomescreenWhenClosed() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Oleville"].firstMatch.tap()
		XCTAssertFalse(homescreen.exists)

		// dismiss safari as soon as it opens
		app.dismissSafariViewController()

		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
	}
}
