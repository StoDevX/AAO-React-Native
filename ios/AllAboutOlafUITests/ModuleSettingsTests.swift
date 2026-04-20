import XCTest

final class ModuleSettingsTests: UITestCase {
	func testShowsSettingsScreenAfterTap() throws {
		SettingsScreen(app: app)
			.openSettings()
			.checkSignInVisible()
			.closeSettings()
			.checkSettingsDismissed()
	}

	func testChangesAppIconToBigOleAndBack() throws {
		// The "You have changed the icon" alert is owned by SpringBoard. On
		// iOS 26 it blocks the app from reaching idle, so UIInterruptionMonitor
		// never fires (the handler only runs during synthesize, which
		// app.tap()'s wait-for-idle never reaches). Dismiss directly via the
		// SpringBoard UI instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		SettingsScreen(app: app)
			.openSettings()
			.changeIconToWindmill()
			.dismissIconChangeAlert(springboard: springboard)
			.checkWindmillSelected()
			.changeIconToDefault()
			.dismissIconChangeAlert(springboard: springboard)
			.checkDefaultSelected()
	}
}
