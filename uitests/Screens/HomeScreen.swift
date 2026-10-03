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

	@discardableResult
	func openSettings() -> Self {
		let menu = app.buttons[TestIdentifiers.Navigation.homeMenu]
		XCTAssertTrue(
			menu.waitForExistence(timeout: 10),
			"Home menu should appear on home screen")
		menu.tap()

		let settings = app.buttons[TestIdentifiers.Navigation.settingsMenuItem].firstMatch
		XCTAssertTrue(
			settings.waitForExistence(timeout: 10),
			"Home menu should offer Settings")
		settings.tap()
		return self
	}

	@discardableResult
	func checkDeveloperSectionVisible() -> Self {
		let developerSection = app.staticTexts[TestIdentifiers.Settings.developer]
		// DEVELOPER is the last section in the Settings form, so it starts out
		// unbuilt rather than merely offscreen.
		scrollUntilExists(developerSection)
		XCTAssertTrue(
			developerSection.waitForExistence(timeout: 30),
			"DEVELOPER section should be visible after enabling dev mode")
		return self
	}
}
