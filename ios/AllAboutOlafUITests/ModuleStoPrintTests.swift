import XCTest

class ModuleStoPrintTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StoPrintScreen(app: app)
			.navigate()
	}

	func testSaysYouAreNotLoggedInByDefault() throws {
		// we need more information about this before we can debug it, so go ahead and run the test
		XCTExpectFailure(
			"stoPrint API request hangs in CI",
			options: XCTExpectedFailure.Options.nonStrict())

		StoPrintScreen(app: app)
			.navigate()
			.checkNotLoggedIn()
	}
}
