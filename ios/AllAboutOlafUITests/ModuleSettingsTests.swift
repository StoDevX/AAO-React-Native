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
		XCTAssertTrue(settingsButton.waitForExistence(timeout: 30), "Settings button should appear on home screen")
		settingsButton.tap()

    let homescreen = app.element(matching: "screen-homescreen")
    XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		let signIn = app.staticTexts["Sign in to St. Olaf"].firstMatch
		XCTAssertTrue(signIn.waitForExistence(timeout: 30), "Sign in to St. Olaf should be visible")

    app.element(matching: "button-close-screen").tap()

    XCTAssertTrue(homescreen.waitForExistence(timeout: 30), "Home screen should be visible after exiting settings")
	}

	func testChangesAppIconToBigOleAndBack() throws {
		// Auto-dismiss the "You have changed the icon" system alert
		addUIInterruptionMonitor(withDescription: "Icon change alert") { alert in
			let okButton = alert.buttons["OK"]
			if okButton.exists {
				okButton.tap()
				return true
			}
			return false
		}

		// Wait for the home screen to load before navigating
		let settingsButton = app.buttons["button-open-settings"]
		XCTAssertTrue(settingsButton.waitForExistence(timeout: 30),
		              "Settings button should appear on home screen")
		settingsButton.tap()

		// Verify default icon is selected, tap Big Ole
		let defaultSelected = app.element(matching: "app-icon-cell-default-selected")
		XCTAssertTrue(defaultSelected.waitForExistence(timeout: 10), "Default icon should be selected initially")
		app.element(matching: "app-icon-cell-icon_type_windmill").tap()

		// Interact with the app to trigger the interruption monitor
		app.tap()

		// Verify Big Ole is now selected
		let windmillSelected = app.element(matching: "app-icon-cell-icon_type_windmill-selected")
		XCTAssertTrue(windmillSelected.waitForExistence(timeout: 10), "Windmill icon should be selected after tapping it")

		// Tap default to switch back
		app.element(matching: "app-icon-cell-default").tap()
		app.tap()

		// Verify default is selected again
		let defaultReselected = app.element(matching: "app-icon-cell-default-selected")
		XCTAssertTrue(defaultReselected.waitForExistence(timeout: 10), "Default icon should be selected after switching back")
	}
}
