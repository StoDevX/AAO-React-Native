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

		app.buttons["Calendar"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasCalendarListVisibleByDefault() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let title = app.staticTexts["Calendar"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Calendar title should be visible")
	}

	func testStOlafCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.buttons["St. Olaf"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOlevilleCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.buttons["Oleville"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testNorthfieldCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.buttons["Northfield"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}
}
