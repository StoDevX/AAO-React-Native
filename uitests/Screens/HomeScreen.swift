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
	func openCustomize() -> CustomizeScreen {
		let button = app.buttons[TestIdentifiers.Navigation.customizeButton]
		XCTAssertTrue(button.waitForExistence(timeout: 10), "Home should have a Customize button")
		button.tap()
		return CustomizeScreen(app: app).checkOpen()
	}

	/// Open the ⋯ menu and leave it open.
	@discardableResult
	func openHomeMenu() -> Self {
		let menu = app.buttons[TestIdentifiers.Navigation.homeMenu]
		XCTAssertTrue(
			menu.waitForExistence(timeout: 10),
			"Home menu should appear on home screen")
		menu.tap()
		return self
	}

	/// Open the ⋯ menu and choose `item`.
	@discardableResult
	func chooseFromHomeMenu(_ item: String) -> Self {
		openHomeMenu()
		let entry = app.buttons[item].firstMatch
		XCTAssertTrue(
			entry.waitForExistence(timeout: 10),
			"Home menu should offer \(item)")
		entry.tap()
		return self
	}

	@discardableResult
	func openSupport() -> SupportScreen {
		chooseFromHomeMenu(TestIdentifiers.Navigation.supportMenuItem)
		return SupportScreen(app: app).checkOpen()
	}

	/// About opens Settings until the About screen lands.
	@discardableResult
	func openAbout() -> Self {
		chooseFromHomeMenu(TestIdentifiers.Navigation.aboutMenuItem)
		let settings = app.element(matching: TestIdentifiers.Settings.screen)
		XCTAssertTrue(settings.waitForExistence(timeout: 10), "About should open Settings")
		return self
	}

	/// Scroll to the Developer tile and open what it holds. Dev mode must be on.
	@discardableResult
	func openDeveloper() -> Self {
		let tile = app.buttons[TestIdentifiers.Buttons.developer].firstMatch
		scrollUntilExists(tile)
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"Home should show a Developer tile after enabling dev mode")
		tile.tap()
		let screen = app.element(matching: TestIdentifiers.Developer.screen)
		XCTAssertTrue(screen.waitForExistence(timeout: 30), "The Developer tile should open Developer")
		return self
	}
}
