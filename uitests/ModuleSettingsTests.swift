import XCTest

class ModuleSettingsTests: UITestCase {
	func testChangesAppIconToEachAlternateAndBack() throws {
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

		let bigOle = settings.appIcon(named: "Big Ole")
		let alternates = ["Old Main", "Windmill (Day)"]

		// there should be three icon settings available
		settings.scrollUntilExists(bigOle)
		XCTAssertTrue(bigOle.exists, "Big Ole should be offered as an icon")
		for name in alternates {
			let row = settings.appIcon(named: name)
			settings.scrollUntilExists(row)
			XCTAssertTrue(row.exists, "\(name) should be offered as an icon")
		}

		// The alternate icon belongs to SpringBoard, so it survives the
		// `--reset-state` launch that clears UserDefaults and AsyncStorage.
		let strayAlert = springboard.buttons["OK"]
		if strayAlert.waitForExistence(timeout: 2) {
			strayAlert.tap()
		}
		settings.scrollIntoView(bigOle)
		if !bigOle.isSelected {
			settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
		}

		// Big Ole is the default icon, so it should be marked by default
		XCTAssertTrue(bigOle.isSelected, "Big Ole should be selected by default")

		// Each alternate is a separate Icon Composer document in the bundle,
		// so each one can be missing on its own.
		for name in alternates {
			settings.selectAppIcon(iconName: name, springboard: springboard)
		}

		// now switch back to the default
		settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
	}
}
