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
		// The "You have changed the icon" alert belongs to SpringBoard. It blocks
		// the app from reaching idle, so UIInterruptionMonitor never fires --
		// that handler only runs during synthesize, which app.tap()'s
		// wait-for-idle never reaches. Dismiss it through SpringBoard instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		let settings = SettingsScreen(app: app)
		settings.openSettings()

		settings.scrollUntilExists(app.staticTexts["App Icon"])
		settings.verifyTitle("App Icon")

		// A picker row is a button labelled with the icon's title, and it is the
		// button that carries the selected trait -- the title text nested inside
		// it carries neither the trait nor the tap target.
		let bigOle = app.buttons["Big Ole"]
		let oldMain = app.buttons["Old Main"]

		// there should be two icon settings available
		settings.scrollUntilExists(bigOle)
		XCTAssertTrue(bigOle.exists, "Big Ole should be offered as an icon")
		settings.scrollUntilExists(oldMain)
		XCTAssertTrue(oldMain.exists, "Old Main should be offered as an icon")

		// The alternate icon belongs to SpringBoard, so it survives the
		// `--reset-state` launch that clears UserDefaults and AsyncStorage. A run
		// that failed between changing the icon and changing it back leaves this
		// one inheriting Old Main, and every retry then fails on the
		// initial-state assertion below rather than on anything it meant to
		// check. Heal that here: this is the only test that reads the icon, so
		// the other twelve need not pay for a reset.
		let strayAlert = springboard.buttons["OK"]
		if strayAlert.waitForExistence(timeout: 2) {
			// A failure between the tap and its alert leaves the alert standing,
			// and it stops the app reaching idle for every query after it.
			strayAlert.tap()
		}
		if oldMain.isSelected {
			settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
		}

		// Big Ole is the default icon, so it should be marked by default
		XCTAssertTrue(bigOle.isSelected, "Big Ole should be selected by default")
		XCTAssertEqual(settings.getSelectedAppIcon(), "Big Ole")

		// change to the other app icon
		settings.selectAppIcon(iconName: "Old Main", springboard: springboard)

		// now switch back to the default
		settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
	}
}
