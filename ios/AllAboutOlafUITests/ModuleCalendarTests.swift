import XCTest

class ModuleCalendarTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["Calendar"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasCalendarListVisibleByDefault() throws {
		app.staticTexts["Calendar"].firstMatch.tap()

		let title = app.staticTexts["Calendar"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Calendar title should be visible")
	}

	func testStOlafCalendarCanBeOpened() throws {
		app.staticTexts["Calendar"].firstMatch.tap()

		let tab = app.staticTexts["St. Olaf"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOlevilleCalendarCanBeOpened() throws {
		app.staticTexts["Calendar"].firstMatch.tap()

		let tab = app.staticTexts["Oleville"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testNorthfieldCalendarCanBeOpened() throws {
		app.staticTexts["Calendar"].firstMatch.tap()

		let tab = app.staticTexts["Northfield"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}
}
