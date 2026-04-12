import XCTest

class ModuleMoreTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["More"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasListVisible() throws {
		app.staticTexts["More"].firstMatch.tap()

		let title = app.staticTexts["More"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "More title should be visible")
	}
}
