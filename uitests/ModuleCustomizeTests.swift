import XCTest

class ModuleCustomizeTests: UITestCase {
	func testPaintbrushOpensCustomize() throws {
		let customize = HomeScreen(app: app).checkHomescreenExists().openCustomize()
		XCTAssertTrue(
			customize.sheet.buttons[TestIdentifiers.Customize.openLinksIn].waitForExistence(timeout: 10),
			"Customize should offer Open Links In")
		customize.capture("customize-sheet").close()
	}

	func testChangesAppIconToEachAlternateAndBack() throws {
		// The "You have changed the icon" alert belongs to SpringBoard. It blocks
		// the app from reaching idle, so UIInterruptionMonitor never fires --
		// that handler only runs during synthesize, which app.tap()'s
		// wait-for-idle never reaches. Dismiss it through SpringBoard instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		let gallery = AppIconScreen(app: app).navigate()
		gallery.capture("app-icon-gallery")

		let bigOle = gallery.icon(named: "Big Ole")
		let alternates = ["Old Main", "Windmill (Day)"]

		for name in ["Big Ole"] + alternates {
			let tile = gallery.icon(named: name)
			gallery.scrollIntoView(tile)
			XCTAssertTrue(tile.exists, "\(name) should be offered as an icon")
		}

		// The alternate icon belongs to SpringBoard, so it survives the
		// `--reset-state` launch that clears UserDefaults and AsyncStorage.
		let strayAlert = springboard.buttons["OK"]
		if strayAlert.waitForExistence(timeout: 2) {
			strayAlert.tap()
		}
		gallery.scrollIntoView(bigOle)
		if !bigOle.isSelected {
			gallery.select("Big Ole", springboard: springboard)
		}

		// Big Ole is the default icon, so it should be marked by default
		XCTAssertTrue(bigOle.isSelected, "Big Ole should be selected by default")

		// Each alternate is a separate Icon Composer document in the bundle,
		// so each one can be missing on its own.
		for name in alternates {
			gallery.select(name, springboard: springboard)
		}

		// now switch back to the default
		gallery.select("Big Ole", springboard: springboard)
	}
}
