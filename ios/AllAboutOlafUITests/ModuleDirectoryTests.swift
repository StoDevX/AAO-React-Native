import XCTest

class ModuleDirectoryTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Directory"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testHasSearchViewVisibleByDefault() throws {
		app.buttons["Directory"].firstMatch.tap()

		let title = app.staticTexts["Directory"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Directory title should be visible")

		let searchPrompt = app.staticTexts["Search the Directory"].firstMatch
		XCTAssertTrue(searchPrompt.waitForExistence(timeout: 30),
		              "Search the Directory prompt should be visible")
	}
}
