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
	}

	func testHasStreamListVisibleByDefault() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let streamList = app.element(matching: "stream-list")
		XCTAssertTrue(streamList.waitForExistence(timeout: 30),
		              "stream-list should be visible")
	}

	func testWebcamsTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let webcams = app.tabButton("Webcams")
		XCTAssertTrue(webcams.waitForExistence(timeout: 30))
		webcams.tap()
	}

	func testKSTOTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let ksto = app.tabButton("KSTO")
		XCTAssertTrue(ksto.waitForExistence(timeout: 30))
		ksto.tap()
	}

	func testKRLXTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let krlx = app.tabButton("KRLX")
		XCTAssertTrue(krlx.waitForExistence(timeout: 30))
		krlx.tap()
	}
}
