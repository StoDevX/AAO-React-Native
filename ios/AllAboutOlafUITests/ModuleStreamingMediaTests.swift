import XCTest

class ModuleStreamingMediaTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Streaming Media"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		let streamList = app.element(matching: "stream-list")
		XCTAssertTrue(
			streamList.waitForExistence(timeout: 30),
			"stream-list should be visible")

		for tab in ["Webcams", "KSTO", "KRLX"] {
			XCTContext.runActivity(named: tab) { activity in
				let tabButton = app.tabButton(tab)
				XCTAssertTrue(
					tabButton.waitForExistence(timeout: 30),
					"\(tab) tab button should be visible")
			}
		}
	}
}
