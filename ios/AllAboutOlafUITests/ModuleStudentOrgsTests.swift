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

		app.buttons["Student Orgs"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testHasListVisible() throws {
		app.buttons["Student Orgs"].firstMatch.tap()

		let title = app.staticTexts["Student Orgs"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Student Orgs title should be visible")
	}
}
