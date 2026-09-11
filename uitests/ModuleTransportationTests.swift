import XCTest

class ModuleTransportationTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		TransportationScreen(app: app)
			.navigate()
			.checkTabs()
	}

	/// The line down the left of a route is drawn a segment at a time, one per
	/// stop, so whether it starts and stops at the end dots is decided by the
	/// rendering rather than by any value we can read back.
	func testRouteLineStartsAndStopsAtTheEndDots() throws {
		TransportationScreen(app: app)
			.navigate()
			.capture("route line, first stop")
			.scrollToEndOfRoute()
			.capture("route line, last stop")
			.verifyEndOfRoute()
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
