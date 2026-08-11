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
		// this is who owns the "You have changed the icon" alert
//    let coreServicesUIAgent = XCUIApplication(bundleIdentifier: "com.apple.CoreServicesUIAgent")
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

    let settings = SettingsScreen(app: app)
    settings.openSettings()

    settings.scrollUntilExists(app.staticTexts["App Icon"])
    settings.verifyTitle("App Icon")

    // there should be two icon settings available
    settings.scrollUntilExists(app.staticTexts["Big Ole"])
    XCTAssert(app.staticTexts["Big Ole"].exists)
    settings.scrollUntilExists(app.staticTexts["Old Main"])
    XCTAssert(app.staticTexts["Old Main"].exists)

    // Big Ole is the default icon, so it should be marked by default
    XCTAssert(app.staticTexts["Big Ole"].isSelected)
    XCTAssertEqual(settings.getSelectedAppIcon(), "Big Ole")

    // change to the other app icon
    settings.selectAppIcon(iconName: "Old Main", springboard: springboard)

    // now switch back to the default
    settings.selectAppIcon(iconName: "Big Ole", springboard: springboard)
    
//    SettingsScreen(app: app)
//      // precondition: verify the default icon
//      .checkSelectedAppIcon(.BigOle)
//      // now toggle the selected icon back and forth
//      .selectAppIcon(.OldMain)
//      .selectAppIcon(.BigOle)
	}
}
