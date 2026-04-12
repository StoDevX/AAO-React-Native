import XCTest

class ModuleCampusDictionaryTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["Campus Dictionary"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasListVisible() throws {
		app.staticTexts["Campus Dictionary"].firstMatch.tap()

		let title = app.staticTexts["Campus Dictionary"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Campus Dictionary title should be visible")
	}
}
