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
			.verifyRowShown(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.search(for: TestIdentifiers.BuildingHours.deburredQuery)
			.verifyRowShown(TestIdentifiers.BuildingHours.aBuilding)
			.verifyRowHidden(TestIdentifiers.BuildingHours.anExcludedBuilding)
	}

	func testSearchWithNoMatchesShowsNoResults() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.BuildingHours.unmatchedQuery)
			.verifyNoResultsShown(for: TestIdentifiers.BuildingHours.unmatchedQuery)
			.capture("Building Hours no-results state")
	}
}
