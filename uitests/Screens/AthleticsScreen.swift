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
		open(route: "/Athletics", mountedWhen: mounted)
	}
}
