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

	@discardableResult
	func dismissIconChangeAlert(springboard: XCUIApplication) -> Self {
		let iconChangeOK = springboard.buttons["OK"]
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear")
		iconChangeOK.tap()
		return self
	}

	/// The title of the icon the picker currently marks as chosen.
	func getSelectedAppIcon() -> String {
		let selectedButton = app.buttons.matching(NSPredicate(format: "isSelected == true"))
			.firstMatch
		return selectedButton.label
	}

	@discardableResult
	func selectAppIcon(iconName: String, springboard: XCUIApplication) -> Self {
		// trigger the change to the icon
		app.buttons[iconName].tap()

		// dismiss the os-level dialog
		dismissIconChangeAlert(springboard: springboard)

		// Wait rather than read once: the screen learns the new icon back from
		// the system asynchronously, so the trait lands a moment after the alert
		// is gone.
		let selected = app.buttons
			.matching(NSPredicate(format: "label == %@ AND isSelected == true", iconName))
			.firstMatch
		XCTAssertTrue(
			selected.waitForExistence(timeout: 10),
			"\(iconName) should be selected after tapping it")

		return self
	}

}
