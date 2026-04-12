import XCTest

class ModuleStudentOrgsTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["Student Orgs"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasListVisible() throws {
		app.staticTexts["Student Orgs"].firstMatch.tap()

		let title = app.staticTexts["Student Orgs"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Student Orgs title should be visible")
	}
}
