import XCTest

class ModuleCampusMapTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Campus Map"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		// dismiss SFSafariViewController; wait for the Done button since
		// Safari view load timing varies (iOS 26 sim renders it slower than
		// iOS 18 did, so tapping immediately would miss it)
		let doneButton = app.buttons["Done"]
		XCTAssertTrue(
			doneButton.waitForExistence(timeout: 10),
			"Safari Done button should appear once the map loads")
		doneButton.tap()

		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))
	}
}
