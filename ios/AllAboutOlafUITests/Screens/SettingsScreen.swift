import XCTest

struct SettingsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func openSettings() -> Self {
		let settingsButton = app.buttons[TestIdentifiers.Navigation.openSettings]
		assertExists(settingsButton, "Settings button should appear on home screen")
		settingsButton.tap()
		return self
	}

	@discardableResult
	func checkSignInVisible() -> Self {
		let signIn = app.staticTexts[TestIdentifiers.Settings.signIn].firstMatch
		assertExists(signIn, "Sign in to St. Olaf should be visible")
		return self
	}

	@discardableResult
	func closeSettings() -> Self {
		app.element(matching: TestIdentifiers.Navigation.closeScreen).tap()
		return self
	}

	@discardableResult
	func checkSettingsDismissed() -> Self {
		// Settings is presented as a pageSheet modal, so the home screen
		// remains mounted in the view hierarchy beneath it. Verify the
		// sheet actually dismissed by checking that the Settings content
		// is gone.
		let signIn = app.staticTexts[TestIdentifiers.Settings.signIn].firstMatch
		assertNotExists(signIn, "Settings sheet should have dismissed")

		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible after exiting settings")
		return self
	}

	@discardableResult
	func changeIconToWindmill() -> Self {
		// Verify default icon is selected, tap windmill
		let defaultSelected = app.element(
			matching: TestIdentifiers.AppIcon.cell("default", selected: true))
		assertExists(defaultSelected, timeout: 10, "Default icon should be selected initially")
		app.element(matching: TestIdentifiers.AppIcon.cell("icon_type_windmill")).tap()
		return self
	}

	@discardableResult
	func dismissIconChangeAlert(springboard: XCUIApplication) -> Self {
		let iconChangeOK = springboard.buttons["OK"]
		assertExists(iconChangeOK, timeout: 10, "Icon change alert should appear")
		iconChangeOK.tap()
		return self
	}

	@discardableResult
	func checkWindmillSelected() -> Self {
		let windmillSelected = app.element(
			matching: TestIdentifiers.AppIcon.cell("icon_type_windmill", selected: true))
		assertExists(windmillSelected, timeout: 10, "Windmill icon should be selected after tapping it")
		return self
	}

	@discardableResult
	func changeIconToDefault() -> Self {
		// Wait for the cell to be accessible before tapping — the app briefly
		// transitions back from SpringBoard after the icon-change alert and
		// tapping without first waiting produces "Timed out while evaluating
		// UI query".
		let defaultIcon = app.element(matching: TestIdentifiers.AppIcon.cell("default"))
		XCTAssertTrue(
			defaultIcon.waitForExistence(timeout: 10),
			"Default icon cell should be visible and tappable")
		defaultIcon.tap()
		return self
	}

	@discardableResult
	func checkDefaultSelected() -> Self {
		let defaultReselected = app.element(
			matching: TestIdentifiers.AppIcon.cell("default", selected: true))
		assertExists(defaultReselected, timeout: 10, "Default icon should be selected after switching back")
		return self
	}
}
