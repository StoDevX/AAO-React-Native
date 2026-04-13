import XCTest

class ModuleTransportationTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		// we need more information about this before we can debug it, so go ahead and run the test
		XCTExpectFailure(
			"Transportation screen crashes in CI",
			options: XCTExpectedFailure.Options.nonStrict())

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Transportation"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		for tab in ["Express Bus", "Red Line", "Blue Line", "Oles Go", "Other Modes"] {
			XCTContext.runActivity(named: tab) { activity in
				let tabElement = app.staticTexts[tab].firstMatch
				XCTAssertTrue(
					tabElement.waitForExistence(timeout: 30),
					"\(tab) tab should be visible")
			}
		}
	}
}
