import XCTest

struct HomeScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func checkHomescreenExists() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible")
		return self
	}

	@discardableResult
	func checkMenusButtonExists() -> Self {
		let menus = app.buttons[TestIdentifiers.Buttons.menus]
		assertExists(menus, "Home screen should show Menus button")
		return self
	}

	@discardableResult
	func longPressNotice() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		assertExists(notice, "Home notice widget should be visible")
		notice.press(forDuration: 1.0)
		return self
	}

	@discardableResult
	func tapEnableDevMode() -> Self {
		let enableDevMode = app.buttons[TestIdentifiers.Settings.enableDevMode]
		assertExists(enableDevMode, timeout: 10, "Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()
		return self
	}

	@discardableResult
	func openSettings() -> Self {
		let settingsButton = app.buttons[TestIdentifiers.Navigation.openSettings]
		assertExists(settingsButton, timeout: 10, "Settings button should appear on home screen")
		settingsButton.tap()
		return self
	}

	@discardableResult
	func checkDeveloperSectionVisible() -> Self {
		let developerSection = app.staticTexts[TestIdentifiers.Settings.developer]
		assertExists(developerSection, "DEVELOPER section should be visible after enabling dev mode")
		return self
	}
}
