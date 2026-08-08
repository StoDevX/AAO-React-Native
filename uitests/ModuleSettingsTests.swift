import XCTest

class ModuleSettingsTests: UITestCase {
	func testShowsSettingsScreenAfterTap() throws {
		SettingsScreen(app: app)
			.openSettings()
			.checkSignInVisible()
			.closeSettings()
			.checkSettingsDismissed()
	}

	/// Guards the whole row being tappable, not just its title text.
	func testCreditsRowIsTappableAwayFromItsCentre() throws {
		SettingsScreen(app: app)
			.openSettings()
			.tapCreditsRowInItsEmptySpace()
			.verifyTitle("Credits")
	}

	func testChangesAppIconToOldMainAndBack() throws {
		// The "You have changed the icon" alert is owned by SpringBoard. It
		// blocks the app from reaching idle, so UIInterruptionMonitor never
		// fires -- that handler only runs during synthesize, which
		// app.tap()'s wait-for-idle never reaches. Dismiss it through the
		// SpringBoard UI instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		SettingsScreen(app: app)
			.openSettings()
			.resetIconToDefaultIfNeeded(springboard: springboard)
			.changeIconToOldMain()
			.dismissIconChangeAlert(springboard: springboard)
			.checkOldMainSelected()
			.changeIconToDefault()
			.dismissIconChangeAlert(springboard: springboard)
			.checkDefaultSelected()
	}
}
