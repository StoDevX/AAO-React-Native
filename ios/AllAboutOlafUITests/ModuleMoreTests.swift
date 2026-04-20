import XCTest

class ModuleMoreTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		MoreScreen(app: app)
			.navigate()
			.verifyMoreTitle()
	}
}
