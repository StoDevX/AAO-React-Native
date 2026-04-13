import XCTest

class ModuleCampusMapTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Campus Map"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testReturnsToHomescreenWhenClosed() throws {
		throw XCTSkip("Cannot return to home from SFViewController")

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Campus Map"].firstMatch.tap()
		XCTAssertFalse(homescreen.exists)

		app.buttons["Done"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
	}
}
