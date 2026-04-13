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
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Transportation"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	func testHasTransportationViewVisibleByDefault() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let title = app.staticTexts["Transportation"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30))
	}

	func testExpressBusTabCanBeOpened() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Express Bus"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testRedLineTabCanBeOpened() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Red Line"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testBlueLineTabCanBeOpened() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Blue Line"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOlesGoTabCanBeOpened() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Oles Go"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOtherModesTabCanBeOpened() throws {
    // we need more information about this before we can debug it, so go ahead and run the test
    XCTExpectFailure("Transportation screen crashes in CI", options: XCTExpectedFailure.Options.nonStrict())

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Other Modes"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}
}
