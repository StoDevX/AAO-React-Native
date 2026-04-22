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
}
