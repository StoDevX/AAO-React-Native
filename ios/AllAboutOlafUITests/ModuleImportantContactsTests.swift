import XCTest

class ModuleImportantContactsTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.staticTexts["Important Contacts"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasContactsListVisibleByDefault() throws {
		app.staticTexts["Important Contacts"].firstMatch.tap()

		let title = app.staticTexts["Important Contacts"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Important Contacts title should be visible")
	}
}
