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

		let title = app.staticTexts["Calendar"].firstMatch
		XCTAssertTrue(
			title.waitForExistence(timeout: 30),
			"Calendar title should be visible")
	}

	func testCalendarTabsCanBeOpened() throws {
		app.buttons["Calendar"].firstMatch.tap()

		for cafe in ["St. Olaf", "Oleville", "Northfield"] {
			XCTContext.runActivity(named: cafe) { activity in
				let tab = app.tabButton(cafe)
				XCTAssertTrue(
					tab.waitForExistence(timeout: 30),
					"\(cafe) tab should be visible")
				tab.tap()
			}
		}
	}
}
