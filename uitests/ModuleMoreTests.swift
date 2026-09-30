import XCTest

class ModuleMoreTests: UITestCaseUnbooted {
	func testIsReachableFromHomescreen() throws {
		MoreScreen(app: app)
			.navigate()
			.verifyMoreTitle()
	}
}
