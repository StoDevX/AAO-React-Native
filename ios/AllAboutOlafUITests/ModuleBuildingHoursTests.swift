import XCTest

class ModuleBuildingHoursTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Building Hours"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testHasBuildingListVisibleByDefault() throws {
		app.buttons["Building Hours"].firstMatch.tap()

		let title = app.staticTexts["Building Hours"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Building Hours title should be visible")
	}
}
