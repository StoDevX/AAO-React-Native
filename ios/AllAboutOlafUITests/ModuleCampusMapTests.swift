import XCTest

final class ModuleCampusMapTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CampusMapScreen(app: app)
			.navigate()
			.dismissSafariAndReturn()
	}
}
