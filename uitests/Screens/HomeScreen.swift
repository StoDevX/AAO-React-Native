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
	func openCustomize() -> CustomizeScreen {
		let customize = CustomizeScreen(app: app)
		tap(app.buttons[TestIdentifiers.Navigation.customizeButton], until: customize.sheet, named: "Customize")
		return customize
	}

	/// Turn dev mode on the way a tester does, by long-pressing the notice at
	/// the foot of Home and choosing "Enable dev mode". The radio's mini-player
	/// is behind it, and a cleared app starts with it off.
	@discardableResult
	func enableDevMode() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		XCTAssertTrue(notice.waitUntilExists(timeout: 30), "Home's notice should exist")
		// The notice follows the tiles, so a short screen leaves it below the fold.
		for _ in 0..<4 where !notice.isHittable {
			app.swipeUp()
		}
		let item = app.buttonLabelled(TestIdentifiers.Home.enableDevMode)
		for _ in 1...3 {
			notice.press(forDuration: 1.0)
			if item.waitUntilExists(timeout: 5) { break }
		}
		XCTAssertTrue(item.exists, "Long-pressing Home's notice should offer \"Enable dev mode\"")
		item.tap()
		XCTAssertTrue(item.waitUntilGone(timeout: 10), "The menu should close once dev mode is on")
		return self
	}
}
