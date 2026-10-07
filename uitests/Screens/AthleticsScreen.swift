import XCTest

struct AthleticsScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Athletics"]
	}

	/// Opens Athletics by its route. The home tile is `devOnly`, but the route
	/// is not, so this needs no dev mode; the tile itself is covered by
	/// `ModuleHomeTests.testEveryTileOpensItsScreen`.
	@discardableResult
	func navigate() -> Self {
		open(route: "/athletics", mountedWhen: mounted)
	}

	/// Open the bottom-toolbar menu that narrows the list to chosen sports.
	@discardableResult
	func openSportsMenu() -> Self {
		let menu = app.buttons[TestIdentifiers.Athletics.sportsMenu]
		XCTAssertTrue(
			menu.existsOrAppears(within: 30),
			"the sports menu should be in the toolbar")
		menu.tap()
		return self
	}

	/// Tap an item in the open menu. A sport is a Toggle and Reset Filters a
	/// Button; both reach XCUITest as buttons labelled with their titles.
	@discardableResult
	func tapMenuItem(_ title: String) -> Self {
		let item = app.buttons[title]
		XCTAssertTrue(
			item.existsOrAppears(within: 30),
			"\(title) should be offered in the sports menu")
		item.tap()
		return self
	}

	/// Close the open menu by tapping away from it, near the top of the list.
	@discardableResult
	func dismissMenu(waitingFor title: String) -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
		XCTAssertTrue(
			app.buttons[title].waitForNonExistence(timeout: 10),
			"tapping away from the sports menu should close it")
		return self
	}
}
