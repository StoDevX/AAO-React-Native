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

		XCTAssertFalse(homescreen.exists)
	}

	func testSaysYouAreNotLoggedInByDefault() throws {
		throw XCTSkip("stoPrint API request hangs in CI")

		app.buttons["stoPrint"].firstMatch.tap()

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertFalse(homescreen.exists)

		let notLoggedIn = app.staticTexts["You are not logged in"].firstMatch
		XCTAssertTrue(notLoggedIn.waitForExistence(timeout: 30))
	}
}
