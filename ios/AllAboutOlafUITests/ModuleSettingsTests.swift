import XCTest

class ModuleSettingsTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testShowsSettingsScreenAfterTap() throws {
		let settingsButton = app.buttons["button-open-settings"]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 30),
			"Settings button should appear on home screen")
		settingsButton.tap()

		// Settings is presented as a pageSheet modal, so the home screen
		// remains mounted in the view hierarchy beneath it. Don't assert
		// that the home screen disappears — instead confirm the Settings
		// screen's content becomes visible.
		let signIn = app.staticTexts["Sign in to St. Olaf"].firstMatch
		XCTAssertTrue(
			signIn.waitForExistence(timeout: 30),
			"Sign in to St. Olaf should be visible")

		app.element(matching: "button-close-screen").tap()

		// The home screen stayed mounted behind the sheet, so verify the
		// sheet actually dismissed by checking that the Settings content
		// is gone.
		XCTAssertTrue(
			signIn.waitForNonExistence(timeout: 30),
			"Settings sheet should have dismissed")

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible after exiting settings")
	}

	func testChangesAppIconToBigOleAndBack() throws {
		// The "You have changed the icon" alert is owned by SpringBoard. On
		// iOS 26 it blocks the app from reaching idle, so UIInterruptionMonitor
		// never fires (the handler only runs during synthesize, which
		// app.tap()'s wait-for-idle never reaches). Dismiss directly via the
		// SpringBoard UI instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
		let iconChangeOK = springboard.buttons["OK"]

		// Wait for the home screen to load before navigating
		let settingsButton = app.buttons["button-open-settings"]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 30),
			"Settings button should appear on home screen")
		settingsButton.tap()

		// Verify default icon is selected, tap Big Ole
		let defaultSelected = app.element(matching: "app-icon-cell-default-selected")
		XCTAssertTrue(
			defaultSelected.waitForExistence(timeout: 10),
			"Default icon should be selected initially")
		app.element(matching: "app-icon-cell-icon_type_windmill").tap()

		// Dismiss the "You have changed the icon" system alert
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear after switching to windmill")
		iconChangeOK.tap()

		// Verify Big Ole is now selected
		let windmillSelected = app.element(matching: "app-icon-cell-icon_type_windmill-selected")
		XCTAssertTrue(
			windmillSelected.waitForExistence(timeout: 10),
			"Windmill icon should be selected after tapping it")

		// Tap default to switch back
		app.element(matching: "app-icon-cell-default").tap()
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear after switching back to default")
		iconChangeOK.tap()

		// Verify default is selected again
		let defaultReselected = app.element(matching: "app-icon-cell-default-selected")
		XCTAssertTrue(
			defaultReselected.waitForExistence(timeout: 10),
			"Default icon should be selected after switching back")
	}
}
