import XCTest

struct SettingsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func openSettings() -> Self {
		let settingsButton = app.buttons[TestIdentifiers.Navigation.openSettings]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 30),
			"Settings button should appear on home screen")
		settingsButton.tap()
		return self
	}

	@discardableResult
	func checkSignInVisible() -> Self {
		// The sign-in row is a SwiftUI Button carrying its title as an
		// accessibility label, so it surfaces as a button, not static text.
		let signIn = app.buttons[TestIdentifiers.Settings.signIn].firstMatch
		XCTAssertTrue(
			signIn.waitForExistence(timeout: 30),
			"Sign in to St. Olaf should be visible")
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
		let signIn = app.buttons[TestIdentifiers.Settings.signIn].firstMatch
		XCTAssertTrue(
			signIn.waitForNonExistence(timeout: 30),
			"Settings sheet should have dismissed")

		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible after exiting settings")
		return self
	}

	@discardableResult
	func tapCreditsRowInItsEmptySpace() -> Self {
		let creditsRow = app.buttons["Credits"].firstMatch
		scrollUntilExists(creditsRow)
		XCTAssertTrue(
			creditsRow.waitForExistence(timeout: 30),
			"Credits row should be visible")
		// The row is title-left, chevron-right, with an empty Spacer between
		// them -- exactly where a missing contentShape would leave the row
		// untappable while center taps (landing on the label) still pass.
		// dx targets that empty middle; dy is deliberately off the row's own
		// center so this tap point differs from what a plain .tap() would
		// already hit.
		creditsRow.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.85)).tap()
		return self
	}

	/// Put the icon back to default if an earlier attempt left it changed.
	///
	/// The alternate icon belongs to SpringBoard, so it survives the
	/// `--reset-state` launch that clears UserDefaults and AsyncStorage. A run
	/// that failed between changing the icon and changing it back leaves the
	/// next attempt looking at Old Main, and every retry then fails on the
	/// initial-state assertion below rather than on anything it meant to check.
	///
	/// This test is the only one that reads the icon, so it heals itself here
	/// instead of making the other twelve pay for a reset they do not need.
	@discardableResult
	func resetIconToDefaultIfNeeded(springboard: XCUIApplication) -> Self {
		// A failure between the tap and its alert leaves the alert standing,
		// and it stops the app reaching idle for every query after it.
		let strayAlert = springboard.buttons["OK"]
		if strayAlert.waitForExistence(timeout: 2) {
			strayAlert.tap()
		}

		// Scroll first, as every other check here does: the icon cells sit far
		// enough down Settings that `exists` is false for a cell that is merely
		// out of view, and this read would then conclude the icon was already
		// default and leave it changed.
		let oldMainSelected = app.element(
			matching: TestIdentifiers.AppIcon.cell("icon_type_old_main", selected: true))
		scrollUntilExists(oldMainSelected)
		guard oldMainSelected.waitForExistence(timeout: 2) else {
			return self
		}

		return changeIconToDefault()
			.dismissIconChangeAlert(springboard: springboard)
	}

	@discardableResult
	func changeIconToOldMain() -> Self {
		// The default is Big Ole; the alternate on offer is Old Main.
		let defaultSelected = app.element(
			matching: TestIdentifiers.AppIcon.cell("default", selected: true))
		scrollUntilExists(defaultSelected)
		XCTAssertTrue(
			defaultSelected.waitForExistence(timeout: 10),
			"Default icon should be selected initially")
		app.element(matching: TestIdentifiers.AppIcon.cell("icon_type_old_main")).tap()
		return self
	}

	@discardableResult
	func dismissIconChangeAlert(springboard: XCUIApplication) -> Self {
		let iconChangeOK = springboard.buttons["OK"]
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear")
		iconChangeOK.tap()
		return self
	}

	@discardableResult
	func checkOldMainSelected() -> Self {
		let oldMainSelected = app.element(
			matching: TestIdentifiers.AppIcon.cell("icon_type_old_main", selected: true))
		scrollUntilExists(oldMainSelected)
		XCTAssertTrue(
			oldMainSelected.waitForExistence(timeout: 10),
			"Old Main icon should be selected after tapping it")
		return self
	}

	@discardableResult
	func changeIconToDefault() -> Self {
		// Wait for the cell to be accessible before tapping — the app briefly
		// transitions back from SpringBoard after the icon-change alert and
		// tapping without first waiting produces "Timed out while evaluating
		// UI query".
		let defaultIcon = app.element(matching: TestIdentifiers.AppIcon.cell("default"))
		scrollUntilExists(defaultIcon)
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
		scrollUntilExists(defaultReselected)
		XCTAssertTrue(
			defaultReselected.waitForExistence(timeout: 10),
			"Default icon should be selected after switching back")
		return self
	}
}
