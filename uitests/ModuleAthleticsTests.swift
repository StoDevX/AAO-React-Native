import XCTest

class ModuleAthleticsTests: UITestCaseUnbooted {
	/// The list opens at its top, with each day in order. The fixtures include a
	/// Yesterday, which sits above Today; the live feed holds nothing before
	/// Today, and opening scrolled to Today waits on #8565.
	func testAthleticsListsDaysInOrderFromTheTop() throws {
		let screen = AthleticsScreen(app: app).navigate()

		let today = app.staticTexts["Today"].firstMatch
		let found = today.waitForExistence(timeout: 30)

		// Captured before the assertion: Athletics draws no list at all when the
		// feed has no scores, and the screenshot is what tells the two apart.
		screen.capture("Athletics - after navigate")
		XCTAssertTrue(found, "Athletics should show a Today section")

		let yesterday = app.staticTexts["Yesterday"].firstMatch
		XCTAssertTrue(yesterday.waitForExistence(timeout: 10), "Athletics should show a Yesterday section")
		XCTAssertTrue(yesterday.isHittable, "the list should open at its top, with Yesterday in view")
		XCTAssertLessThan(
			yesterday.frame.minY, today.frame.minY, "Yesterday should sit above Today")
	}

	/// The sports menu offers each sport as a toggle, and Reset Filters only
	/// once one is on. The rows are written in reading order and pinned there
	/// with menuOrder(.fixed); the screenshot is what shows they arrive that way
	/// rather than reversed, as a bottom-bar menu otherwise draws them.
	func testAthleticsSportsMenu() throws {
		let screen = AthleticsScreen(app: app).navigate()
		let reset = TestIdentifiers.Athletics.resetFilters

		screen.openSportsMenu()
		XCTAssertTrue(
			app.buttons["Volleyball"].waitForExistence(timeout: 30),
			"Volleyball should be offered in the sports menu")
		XCTAssertTrue(
			app.buttons[reset].waitForNonExistence(timeout: 10),
			"Reset Filters should be absent while every sport shows")
		screen.capture("Athletics - sports menu")

		screen.tapMenuItem("Volleyball").dismissMenu(waitingFor: "Volleyball")

		screen.openSportsMenu()
		XCTAssertTrue(
			app.buttons[reset].waitForExistence(timeout: 30),
			"Reset Filters should be offered once a sport is chosen")
		screen.capture("Athletics - sports menu with a sport chosen")

		screen.tapMenuItem(reset)
		screen.openSportsMenu()
		XCTAssertTrue(
			app.buttons[reset].waitForNonExistence(timeout: 10),
			"Reset Filters should clear the choice")
	}
}
