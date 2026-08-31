import XCTest

class ModuleNewsTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		NewsScreen(app: app)
			.navigate()
			.verifyNewsRowsAppear()
	}
}
