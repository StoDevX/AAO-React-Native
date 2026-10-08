import XCTest

struct HomeScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func checkHomescreenExists() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitUntilExists(timeout: 30),
			"Home screen should be visible")
		return self
	}

	/// Check Home draws its tiles as a grid, not a list.
	@discardableResult
	func verifyTiled() -> Self {
		verifyLayout(shown: tileGrid, hidden: list, named: "the tile grid")
	}

	/// Check Home draws its tiles as a list, not a grid.
	@discardableResult
	func verifyListed() -> Self {
		verifyLayout(shown: list, hidden: tileGrid, named: "the list")
	}

	private var tileGrid: XCUIElement {
		app.element(matching: TestIdentifiers.Home.tileGrid)
	}

	/// The list layout's `List`. The screen's `Host` gives its own identifier
	/// to the collection view the list draws, overriding any the list sets, so
	/// the element type is what tells the list from the host's other views.
	private var list: XCUIElement {
		app.collectionViews.matching(identifier: TestIdentifiers.Home.screen).firstMatch
	}

	private func verifyLayout(shown: XCUIElement, hidden: XCUIElement, named name: String) -> Self {
		XCTAssertTrue(shown.waitUntilExists(timeout: 10), "Home should draw \(name)")
		XCTAssertTrue(hidden.waitUntilGone(timeout: 10), "Home should draw only \(name)")
		return self
	}

	@discardableResult
	func longPressNotice() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		XCTAssertTrue(
			notice.waitUntilExists(timeout: 30),
			"Home notice widget should be visible")
		notice.press(forDuration: 1.0)
		return self
	}

	@discardableResult
	func tapEnableDevMode() -> Self {
		let enableDevMode = app.buttons[TestIdentifiers.Home.enableDevMode]
		XCTAssertTrue(
			enableDevMode.waitUntilExists(timeout: 10),
			"Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()
		return self
	}

	@discardableResult
	func openCustomize() -> CustomizeScreen {
		let customize = CustomizeScreen(app: app)
		tap(app.buttons[TestIdentifiers.Navigation.customizeButton], until: customize.sheet, named: "Customize")
		return customize
	}

	/// Open the ⋯ menu and choose `item`, which should open `mounted`.
	@discardableResult
	func chooseFromHomeMenu(_ item: String, opening mounted: XCUIElement) -> Self {
		let menu = app.buttons[TestIdentifiers.Navigation.homeMenu]
		let entry = app.buttons[item].firstMatch
		tap(menu, until: entry, named: "Home's menu")
		return tap(entry, until: mounted, named: "\(item) in Home's menu")
	}

	@discardableResult
	func openAbout() -> AboutScreen {
		let about = AboutScreen(app: app)
		chooseFromHomeMenu(TestIdentifiers.Navigation.aboutMenuItem, opening: about.host)
		return about
	}

	/// Scroll to `tile` and open it, checking it opened its own screen.
	@discardableResult
	func openTile(_ tile: String, expecting mounted: XCUIElement) -> Self {
		let button = app.buttons[tile].firstMatch
		scrollUntilExists(button)
		// The Map's sheet can take most of a minute on a loaded runner.
		return tap(button, until: mounted, named: "the \(tile) tile", wait: 20)
	}

	/// Scroll to the Developer tile and open what it holds. Dev mode must be on.
	@discardableResult
	func openDeveloper() -> Self {
		let screen = app.element(matching: TestIdentifiers.Developer.screen)
		openTile(TestIdentifiers.Buttons.developer, expecting: screen)
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Developer.components].firstMatch.waitUntilExists(timeout: 10),
			"Developer should hold the tools Settings' Developer section held")
		return self
	}
}
