import XCTest

class ModuleCampusMapTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CampusMapScreen(app: app)
			.navigate()
			.dismissSafari()
			.checkReturnedToHomescreen()
	}
}
