import XCTest

class ModuleBuildingHoursTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.verifyBuildingHoursTitle()
	}

	func testSearchNarrowsTheList() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.verifyRowShown(TestIdentifiers.BuildingHours.aBuilding)
			.search(for: TestIdentifiers.BuildingHours.deburredQuery)
			.verifyRowShown(TestIdentifiers.BuildingHours.aBuilding)
			.verifyRowHidden(TestIdentifiers.BuildingHours.anExcludedBuilding)
	}
}
