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

		XCTAssertFalse(homescreen.exists)
	}

	func testHasStreamListVisibleByDefault() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let streamList = app.element(matching: "stream-list")
		XCTAssertTrue(streamList.waitForExistence(timeout: 30),
		              "stream-list should be visible")
	}

	func testWebcamsTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let webcams = app.staticTexts["Webcams"].firstMatch
		XCTAssertTrue(webcams.waitForExistence(timeout: 30))
		webcams.tap()

		let eastQuad = app.staticTexts["East Quad"].firstMatch
		XCTAssertTrue(eastQuad.waitForExistence(timeout: 30),
		              "East Quad should be visible after tapping Webcams")
	}

	func testKSTOTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let ksto = app.staticTexts["KSTO"].firstMatch
		XCTAssertTrue(ksto.waitForExistence(timeout: 30))
		ksto.tap()

		let kstoTitle = app.staticTexts["KSTO 93.1 FM"].firstMatch
		XCTAssertTrue(kstoTitle.waitForExistence(timeout: 30),
		              "KSTO 93.1 FM should be visible")
	}

	func testKRLXTabCanBeOpened() throws {
		app.buttons["Streaming Media"].firstMatch.tap()

		let krlx = app.staticTexts["KRLX"].firstMatch
		XCTAssertTrue(krlx.waitForExistence(timeout: 30))
		krlx.tap()

		let krlxTitle = app.staticTexts["88.1 KRLX-FM"].firstMatch
		XCTAssertTrue(krlxTitle.waitForExistence(timeout: 30),
		              "88.1 KRLX-FM should be visible")
	}
}
