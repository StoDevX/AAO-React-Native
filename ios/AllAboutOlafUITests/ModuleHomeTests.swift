import XCTest

class ModuleHomeTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testShowsTheHomeScreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30),
		              "Home screen should be visible")
	}

	func testHomeScreenRenders() throws {
		let menus = app.buttons["Menus"]
		XCTAssertTrue(menus.waitForExistence(timeout: 30),
		              "Home screen should show Menus button")
	}
}
