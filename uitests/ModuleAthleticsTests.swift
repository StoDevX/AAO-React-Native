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

	func testAthleticsSportsFilter() throws {
		let screen = AthleticsScreen(app: app).navigate()
		let filters = FilterScreen(app: app)
		let key = TestIdentifiers.Filter.athleticsSports

		filters.openFilter(key, until: filters.option("Volleyball"))
		screen.capture("Athletics - Sports filter")

		filters.option("Volleyball").tap()
		filters.dismissSheet(waitingFor: "Volleyball")
		filters.verifyTrigger(key, isSelected: true)
	}
}
