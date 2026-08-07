import XCTest

struct HomeScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func checkHomescreenExists() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")
		return self
	}

	@discardableResult
	func checkMenusButtonExists() -> Self {
		let menus = app.buttons[TestIdentifiers.Buttons.menus]
		XCTAssertTrue(
			menus.waitForExistence(timeout: 30),
			"Home screen should show Menus button")
		return self
	}

	/// Taps a home tile near its top-right corner rather than its centre.
	///
	/// A SwiftUI button's hit region comes from its label, so a tile whose fill
	/// and frame are applied without `contentShape` reports the full coloured
	/// rect to the accessibility tree while only the icon and title actually
	/// respond. `tap()` uses the reported centre, which lands on the live part
	/// and passes either way -- so only an off-centre tap can tell them apart.
	@discardableResult
	func tapTileNearItsEdge(_ label: String) -> Self {
		let tile = app.buttons[label].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(label) tile should be visible")
		// Top-right: the icon is centred and narrow, so this corner is empty
		// fill. The bottom of the tile is riskier -- a long title like
		// "Building Hours" runs most of the width.
		tile.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.15)).tap()
		return self
	}

	@discardableResult
	func checkHomescreenDismissed() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForNonExistence(timeout: 30),
			"Tapping a tile away from its centre should still navigate")
		return self
	}

	@discardableResult
	func longPressNotice() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		XCTAssertTrue(
			notice.waitForExistence(timeout: 30),
			"Home notice widget should be visible")
		notice.press(forDuration: 1.0)
		return self
	}

	@discardableResult
	func tapEnableDevMode() -> Self {
		let enableDevMode = app.buttons[TestIdentifiers.Settings.enableDevMode]
		XCTAssertTrue(
			enableDevMode.waitForExistence(timeout: 10),
			"Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()
		return self
	}

	@discardableResult
	func openSettings() -> Self {
		let settingsButton = app.buttons[TestIdentifiers.Navigation.openSettings]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 10),
			"Settings button should appear on home screen")
		settingsButton.tap()
		return self
	}

	@discardableResult
	func checkDeveloperSectionVisible() -> Self {
		let developerSection = app.staticTexts[TestIdentifiers.Settings.developer]
		XCTAssertTrue(
			developerSection.waitForExistence(timeout: 30),
			"DEVELOPER section should be visible after enabling dev mode")
		return self
	}
}
