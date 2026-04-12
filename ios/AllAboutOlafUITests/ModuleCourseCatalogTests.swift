import XCTest

class ModuleCourseCatalogTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["Course Catalog"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasSearchViewVisibleByDefault() throws {
		app.staticTexts["Course Catalog"].firstMatch.tap()

		let title = app.staticTexts["Course Catalog"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Course Catalog title should be visible")

		let recent = app.staticTexts["Recent"].firstMatch
		XCTAssertTrue(recent.waitForExistence(timeout: 30),
		              "Recent section should be visible")
	}
}
