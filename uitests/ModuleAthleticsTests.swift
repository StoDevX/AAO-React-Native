import XCTest

class ModuleAthleticsTests: UITestCaseUnbooted {
	/// The list opens on Today, and the days before it are a scroll up away.
	func testAthleticsOpensOnTodayAndScrollsUpToYesterday() throws {
		let screen = AthleticsScreen(app: app).navigate()

		let today = app.staticTexts["Today"].firstMatch
		let found = today.waitForExistence(timeout: 30)

		// Captured before the assertion: Athletics draws no list at all when the
		// feed has no scores, and the screenshot is what tells the two apart.
		screen.capture("Athletics - after navigate")
		XCTAssertTrue(found, "Athletics should show a Today section")
		XCTAssertTrue(today.isHittable, "the list should open scrolled to Today")

		// Today's first game sits at the top, so the day before is scrolled out
		// of view above it.
		let yesterday = app.staticTexts["Yesterday"].firstMatch
		XCTAssertFalse(
			yesterday.exists && yesterday.isHittable,
			"Yesterday should start above the top of the list")

		app.swipeDown()
		XCTAssertTrue(yesterday.waitForExistence(timeout: 10), "Yesterday should be above Today")
		XCTAssertTrue(yesterday.isHittable, "a scroll up should bring Yesterday into view")
		screen.capture("Athletics - scrolled up to Yesterday")
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
