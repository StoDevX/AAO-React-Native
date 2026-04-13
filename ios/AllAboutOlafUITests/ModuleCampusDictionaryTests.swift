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

		app.buttons["Campus Dictionary"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
    
    let title = app.staticTexts["Campus Dictionary"].firstMatch
    XCTAssertTrue(title.waitForExistence(timeout: 30), "Campus Dictionary title should be visible")
	}
}
