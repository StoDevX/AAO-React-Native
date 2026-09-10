import XCTest

class ModuleTransportationTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		// we need more information about this before we can debug it, so go ahead and run the test
		XCTExpectFailure(
			"Transportation screen crashes in CI",
			options: XCTExpectedFailure.Options.nonStrict())

		TransportationScreen(app: app)
			.navigate()
			.checkTabs()
	}

	/// The line down the left of a route is drawn a segment at a time, one per
	/// stop, so whether it starts and stops at the end dots is decided by the
	/// rendering rather than by any value we can read back.
	func testRouteLineStartsAndStopsAtTheEndDots() throws {
		XCTExpectFailure(
			"Transportation screen crashes in CI",
			options: XCTExpectedFailure.Options.nonStrict())

		TransportationScreen(app: app)
			.navigate()
			.capture("route line, first stop")
			.scrollToEndOfRoute()
			.capture("route line, last stop")
			.verifyEndOfRoute()
	}
}
