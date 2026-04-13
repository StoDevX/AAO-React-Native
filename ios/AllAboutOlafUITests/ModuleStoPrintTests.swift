import XCTest

class ModuleStoPrintTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["stoPrint"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testSaysYouAreNotLoggedInByDefault() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("stoPrint API request hangs in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["stoPrint"].firstMatch.tap()

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		let notLoggedIn = app.staticTexts["You are not logged in"].firstMatch
		XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
	}
}
