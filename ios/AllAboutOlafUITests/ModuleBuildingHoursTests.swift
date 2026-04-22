import XCTest

class ModuleBuildingHoursTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.verifyBuildingHoursTitle()
	}
}
