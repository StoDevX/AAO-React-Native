import XCTest

class ModuleSettingsTests: UITestCase {
	func testShowsSettingsScreenAfterTap() throws {
		SettingsScreen(app: app)
			.openSettings()
			.checkSignInVisible()
			.closeSettings()
			.checkSettingsDismissed()
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
			.changeIconToOldMain()
			.dismissIconChangeAlert(springboard: springboard)
			.checkOldMainSelected()
			.changeIconToDefault()
			.dismissIconChangeAlert(springboard: springboard)
			.checkDefaultSelected()
	}
}
