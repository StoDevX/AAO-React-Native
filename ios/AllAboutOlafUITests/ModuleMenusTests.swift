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

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
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

		let stavHall = app.tabButton("Stav Hall")
		XCTAssertTrue(stavHall.waitForExistence(timeout: 30))
		stavHall.tap()
	}

	func testTheCageMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let theCage = app.tabButton("The Cage")
		XCTAssertTrue(theCage.waitForExistence(timeout: 30))
		theCage.tap()
	}

	func testThePauseMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let thePause = app.tabButton("The Pause")
		XCTAssertTrue(thePause.waitForExistence(timeout: 30))
		thePause.tap()
	}

	// MARK: - Carleton menus

	func testBurtonMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.tabButton("Carleton")
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let burton = app.elementWithLabel(startingWith: "Burton")
		XCTAssertTrue(burton.waitForExistence(timeout: 30))
		burton.tap()
	}

	func testLDCMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.tabButton("Carleton")
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let ldc = app.elementWithLabel(startingWith: "LDC")
		XCTAssertTrue(ldc.waitForExistence(timeout: 30))
		ldc.tap()
	}

	func testWeitzCenterMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.tabButton("Carleton")
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let weitzCenter = app.elementWithLabel(startingWith: "Weitz Center")
		XCTAssertTrue(weitzCenter.waitForExistence(timeout: 30))
		weitzCenter.tap()
	}

	func testSaylesHillMenuCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		let carleton = app.tabButton("Carleton")
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		let saylesHill = app.elementWithLabel(startingWith: "Sayles Hill")
		XCTAssertTrue(saylesHill.waitForExistence(timeout: 30))
		saylesHill.tap()
	}
}
