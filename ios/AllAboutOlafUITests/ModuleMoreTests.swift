import XCTest

final class ModuleMoreTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		MoreScreen(app: app)
			.navigate()
			.verifyMoreTitle()
	}
}
