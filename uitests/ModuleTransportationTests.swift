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
}
