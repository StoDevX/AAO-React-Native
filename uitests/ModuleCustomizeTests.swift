import XCTest

class ModuleCustomizeTests: UITestCase {
	func testChangesAppIconToAnAlternate() throws {
		// The "You have changed the icon" alert belongs to SpringBoard. It blocks
		// the app from reaching idle, so UIInterruptionMonitor never fires --
		// that handler only runs during synthesize, which app.tap()'s
		// wait-for-idle never reaches. Dismiss it through SpringBoard instead.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

		let gallery = AppIconScreen(app: app).navigate()
		gallery.capture("app-icon-gallery")

		let bigOle = gallery.icon(named: "Big Ole")
		gallery.scrollIntoView(bigOle)
		XCTAssertTrue(bigOle.exists, "Big Ole should be offered as an icon")

		// The alternate icon belongs to SpringBoard, so it survives the
		// `--reset-state` launch that clears UserDefaults and AsyncStorage. Only
		// then can an earlier run's alert still be up, so SpringBoard is asked
		// about it only then: a query there can stall on a debug-information
		// collection that costs far more than the check.
		if !bigOle.isSelected {
			let strayAlert = springboard.buttons["OK"]
			if strayAlert.waitForExistence(timeout: 2) {
				strayAlert.tap()
			}
			gallery.select("Big Ole", springboard: springboard)
		}

		// Big Ole is the default icon, so it should be marked by default
		XCTAssertTrue(bigOle.isSelected, "Big Ole should be selected by default")

		gallery.select("Old Main", springboard: springboard)
	}
}
