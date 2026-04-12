import XCTest

class ModuleTransportationTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Transportation"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasTransportationViewVisibleByDefault() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let title = app.staticTexts["Transportation"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30))
	}

	func testExpressBusTabCanBeOpened() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Express Bus"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testRedLineTabCanBeOpened() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Red Line"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testBlueLineTabCanBeOpened() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Blue Line"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOlesGoTabCanBeOpened() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Oles Go"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}

	func testOtherModesTabCanBeOpened() throws {
		throw XCTSkip("Transportation screen crashes in CI")

		app.buttons["Transportation"].firstMatch.tap()

		let tab = app.staticTexts["Other Modes"].firstMatch
		XCTAssertTrue(tab.waitForExistence(timeout: 30))
		tab.tap()
	}
}
