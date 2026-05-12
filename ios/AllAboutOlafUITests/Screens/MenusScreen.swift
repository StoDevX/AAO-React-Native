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
		checkTabButtons(TestIdentifiers.Menus.stOlafCafes, tap: true)
	}

	@discardableResult
	func checkCarletonCafes() -> Self {
		let carleton = app.tabButton(TestIdentifiers.Menus.carleton)
		assertExists(carleton, "Carleton tab should be visible")
		carleton.tap()

		for cafe in TestIdentifiers.Menus.carletonCafes {
			XCTContext.runActivity(named: "open \(cafe)") { _ in
				let menu = app.elementWithLabel(startingWith: cafe)
				assertExists(menu, "\(cafe) menu should be visible")
				menu.tap()
			}

			// tab navigator should disappear
			assertNotExists(carleton, "\(cafe) should navigate away from tabs")
			// now look for the cafe name in the header
			assertExists(
				app.staticTexts[cafe].firstMatch,
				"\(cafe) title should be visible")

			// TODO: how to go back? maybe this?
			app.elementWithLabel(startingWith: "Back").tap()

			// and wait for the tab navigator to reappear
			assertExists(carleton, "Carleton tab should reappear after going back")
		}
		return self
	}
}
