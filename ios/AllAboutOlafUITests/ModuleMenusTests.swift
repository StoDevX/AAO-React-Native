import XCTest

class ModuleMenusTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	// MARK: - Navigation

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["Menus"].firstMatch.tap()

		XCTAssertFalse(homescreen.exists)
	}

	func testHasMenusListVisibleByDefault() throws {
		app.buttons["Menus"].firstMatch.tap()

		let title = app.staticTexts["Menus"].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 30),
		              "Menus title should be visible")
	}

	// MARK: - St. Olaf menus

	func testStavHallMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let stavHall = app.staticTexts["Stav Hall"].firstMatch
		XCTAssertTrue(stavHall.waitForExistence(timeout: 30))
		stavHall.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	func testTheCageMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let theCage = app.staticTexts["The Cage"].firstMatch
		XCTAssertTrue(theCage.waitForExistence(timeout: 30))
		theCage.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	func testThePauseMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let thePause = app.staticTexts["The Pause"].firstMatch
		XCTAssertTrue(thePause.waitForExistence(timeout: 30))
		thePause.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	// MARK: - Carleton menus

	func testBurtonMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.staticTexts["Carleton"].firstMatch
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let burton = app.staticTexts["Burton"].firstMatch
		XCTAssertTrue(burton.waitForExistence(timeout: 30))
		burton.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	func testLDCMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.staticTexts["Carleton"].firstMatch
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let ldc = app.staticTexts["LDC"].firstMatch
		XCTAssertTrue(ldc.waitForExistence(timeout: 30))
		ldc.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	func testWeitzCenterMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.staticTexts["Carleton"].firstMatch
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let weitzCenter = app.staticTexts["Weitz Center"].firstMatch
		XCTAssertTrue(weitzCenter.waitForExistence(timeout: 30))
		weitzCenter.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}

	func testSaylesHillMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.staticTexts["Carleton"].firstMatch
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let saylesHill = app.staticTexts["Sayles Hill"].firstMatch
		XCTAssertTrue(saylesHill.waitForExistence(timeout: 30))
		saylesHill.tap()

		let specialsOnly = app.staticTexts["Specials Only"].firstMatch
		XCTAssertTrue(specialsOnly.waitForExistence(timeout: 30))
	}
}
