import XCTest

class ModuleSettingsTests: UITestCase {
	func testChangesAppIconToOldMainAndBack() throws {
		// The "You have changed the icon" alert belongs to SpringBoard. It blocks
		// the app from reaching idle, so UIInterruptionMonitor never fires --
		// that handler only runs during synthesize, which app.tap()'s
		// wait-for-idle never reaches. Dismiss it through SpringBoard instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		let settings = SettingsScreen(app: app)

    // open Settings sheet
    XCTAssertTrue(app.element(matching: TestIdentifiers.Home.screen).waitForExistence(timeout: 10))
    app.buttons[TestIdentifiers.Navigation.openSettings].firstMatch.tap()
    settings.verifyTitle(TestIdentifiers.Navigation.settingsSheetTitle)

		settings.scrollUntilExists(app.staticTexts["App Icon"])

		let bigOle = app.buttons["Big Ole"]
		let oldMain = app.buttons["Old Main"]

		// there should be two icon settings available
		settings.scrollUntilExists(bigOle)
		XCTAssertTrue(bigOle.exists, "Big Ole should be offered as an icon")
		settings.scrollUntilExists(oldMain)
		XCTAssertTrue(oldMain.exists, "Old Main should be offered as an icon")

		// The alternate icon belongs to SpringBoard, so it survives the
		// `--reset-state` launch that clears UserDefaults and AsyncStorage.
		let strayAlert = springboard.buttons["OK"]
		if strayAlert.waitForExistence(timeout: 2) {
			strayAlert.tap()
		}
		if oldMain.isSelected {
			settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
		}

		// Big Ole is the default icon, so it should be marked by default
		XCTAssertTrue(bigOle.isSelected, "Big Ole should be selected by default")

		// change to the other app icon
		settings.selectAppIcon(iconName: "Old Main", springboard: springboard)

		// now switch back to the default
		settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
	}
}
