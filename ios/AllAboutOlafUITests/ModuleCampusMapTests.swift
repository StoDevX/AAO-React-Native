import XCTest

class ModuleCampusMapTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
    XCTExpectFailure("can't hit the Done button in SFSafariViewController")

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Campus Map"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		// dismiss SFSafariViewController
		app.buttons["Done"].tap()

		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
	}
}
