import XCTest

struct MenusScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.menus)
	}

	@discardableResult
	func verifyMenusTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.menus)
	}

	@discardableResult
	func checkStOlafCafes() -> Self {
		for cafe in TestIdentifiers.Menus.stOlafCafes {
			XCTContext.runActivity(named: cafe) { _ in
				let tab = app.tabButton(cafe)
				XCTAssertTrue(
					tab.waitForExistence(timeout: 30),
					"\(cafe) tab should be visible")
				tab.tap()
			}
		}
		return self
	}

	@discardableResult
	func checkCarletonCafes() -> Self {
		let carleton = app.tabButton(TestIdentifiers.Menus.carleton)
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		for cafe in TestIdentifiers.Menus.carletonCafes {
			XCTContext.runActivity(named: "open \(cafe)") { _ in
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
		return self
	}
}
