import XCTest

class ModuleCampusDictionaryTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.verifyCampusDictionaryTitle()
	}
}
