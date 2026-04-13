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

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testHasCalendarListVisibleByDefault() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let title = app.staticTexts["Calendar"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Calendar title should be visible")
	}

	func testStOlafCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.tabButton("St. Olaf")
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOlevilleCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.tabButton("Oleville")
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testNorthfieldCalendarCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		let tab = app.tabButton("Northfield")
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}
}
