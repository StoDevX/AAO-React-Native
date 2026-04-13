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

		// Campus Dictionary is below the fold; scroll to ensure it is visible
		let button = app.buttons["Campus Dictionary"].firstMatch
		if !button.isHittable {
			app.swipeUp()
		}
		button.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasListVisible() throws {
		let button = app.buttons["Campus Dictionary"].firstMatch
		if !button.isHittable {
			app.swipeUp()
		}
		button.tap()

		let title = app.staticTexts["Campus Dictionary"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Campus Dictionary title should be visible")
	}
}
