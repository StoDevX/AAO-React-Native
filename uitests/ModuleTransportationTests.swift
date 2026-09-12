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

	func testTransportationOtherModesList() throws {
		let screen = TransportationScreen(app: app).navigate()

		let otherTab = app.tabButton("Other")
		XCTAssertTrue(
			otherTab.waitForExistence(timeout: 30),
			"Other tab should be visible on Transportation")
		otherTab.tap()

		let section = app.staticTexts["Bus"].firstMatch
		XCTAssertTrue(section.waitForExistence(timeout: 30), "The Other tab should be showing")

		screen.capture("Transportation - Other Modes")
	}
}
