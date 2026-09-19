import XCTest

class ModuleTransportationTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		TransportationScreen(app: app)
			.navigate()
			.checkTabs()
	}

	/// A single stop's schedule draws the same progress bar down its departure
	/// times, so it has the same question to answer as the route above: whether
	/// the bar and its dots survive the card they are drawn inside.
	func testAStopSchedulePresents() throws {
		TransportationScreen(app: app)
			.navigate()
			.openFirstStop()
			.verifyStopScheduleShown()
			.capture("stop schedule")
	}

	/// The day picker lives in the navigation bar rather than in the content,
	/// so the section title is the only thing on screen that says which day is
	/// showing. This checks the two stay in step.
	func testPickingADayRetitlesTheSchedule() throws {
		TransportationScreen(app: app)
			.navigate()
			.pickDay(TestIdentifiers.Transportation.aDay)
			.verifyScheduleShows(day: TestIdentifiers.Transportation.aDay)
			.capture("Transportation - Saturday schedule")
	}

	func testTransportationOtherModesList() throws {
		let screen = TransportationScreen(app: app).navigate()

		let otherTab = app.tabButton("Other")
		XCTAssertTrue(
			otherTab.waitForExistence(timeout: 30),
			"Other tab should be visible on Transportation")

		let section = app.staticTexts["Bus"].firstMatch
		for attempt in 1...3 {
			otherTab.tap()
			if section.waitForExistence(timeout: 10) {
				break
			}
			XCTContext.runActivity(named: "Tap \(attempt) on Other did not switch; retrying") { _ in }
		}
		XCTAssertTrue(section.exists, "The Other tab should be showing")

		screen.capture("Transportation - Other Modes")
	}
}
