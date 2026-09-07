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

	func testTappingARowPresentsTheDetailSheet() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.detailTitle)
			.verifyListStillBehind()
			.capture("Building Hours detail sheet at half detent")
	}

	/// The Cage has enough schedule content (two day groups plus a note) to
	/// overflow the sheet's 0.5 detent, so dragging it open is the case that
	/// would catch content stuck laid out at the smaller detent's height.
	func testDraggingTheDetailSheetRevealsTheRestOfItsContent() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.detailTitle)
			.capture("Building Hours detail sheet before dragging to the larger detent")
			.expandDetailSheet()
			.capture("Building Hours detail sheet after dragging to the larger detent")
			.verifyDetailSheetFullyLaidOut()
	}

	func testDetailSheetMenuOffersReportAProblem() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.openDetailMenu()
			.verifyReportActionOffered()
	}
}
