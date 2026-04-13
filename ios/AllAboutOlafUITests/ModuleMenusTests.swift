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

		let title = app.staticTexts["Menus"].firstMatch
		XCTAssertTrue(
			title.waitForExistence(timeout: 30),
			"Menus title should be visible")
	}

	// MARK: - St. Olaf menus

	func testStOlafMenusCanBeOpened() throws {
		app.buttons["Menus"].firstMatch.tap()

		for cafe in ["Stav Hall", "The Cage", "The Pause"] {
			XCTContext.runActivity(named: cafe) { activity in
				let tab = app.tabButton(cafe)
				XCTAssertTrue(
					tab.waitForExistence(timeout: 30),
					"\(cafe) tab should be visible")
				tab.tap()
			}
		}
	}

	// MARK: - Carleton menus

	func testCarletonMenusCanBeOpened() throws {
		XCTExpectFailure("can't seem to hit the Burton list item - seems to be grabbing the full-screen view instead?")

		app.buttons["Menus"].firstMatch.tap()

		// wait for the Carleton tab to load
		let carleton = app.tabButton("Carleton")
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		for cafe in ["Burton", "LDC", "Weitz Center", "Sayles Hill"] {
			XCTContext.runActivity(named: "open \(cafe)") { activity in
				let menu = app.elementWithLabel(startingWith: cafe)
				XCTAssertTrue(
					menu.waitForExistence(timeout: 30),
					"\(cafe) menu should be visible")
				menu.tap()
			}

			// tab navigator should disappear
			XCTAssertTrue(carleton.waitForNonExistence(timeout: 30))
			// now look for the cafe name in the header
			XCTAssertTrue(
				app.staticTexts[cafe].firstMatch.waitForExistence(timeout: 30),
				"\(cafe) title should be visible")

			// TODO: how to go back? maybe this?
			app.elementWithLabel(startingWith: "Back").tap()

			// and wait for the tab navigator to reappear
			XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		}
	}
}
