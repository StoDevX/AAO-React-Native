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
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyListStillBehind()
			.capture("Building Hours detail sheet at half detent")
	}

	/// `sheetLargestUndimmedDetentIndex: 'none'` is what makes this true: UIKit
	/// dims and blocks touches to the list behind the sheet at every detent,
	/// not merely below the largest one. Without it, a tap on a different
	/// building's row lands on the list and pushes a second detail sheet on
	/// top of the first.
	func testTappingARowBehindTheSheetDoesNotStackASecondSheet() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.attemptToTapRowBehindSheet(TestIdentifiers.BuildingHours.aSecondBuilding)
			.capture("Building Hours after tapping a row behind the sheet")
			.verifyNoSecondSheetForStavHall()
	}

	/// `aBuildingWithLongSchedule` has two schedule sections plus a resource
	/// link -- enough combined content to overflow the sheet's 0.5 detent,
	/// unlike `anExcludedBuilding`'s single short section, which already fits
	/// it entirely. Dragging it open is the case that would catch content
	/// stuck laid out at the smaller detent's height.
	func testDraggingTheDetailSheetRevealsTheRestOfItsContent() throws {
		let screen = BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.aBuildingWithLongSchedule)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.aBuildingWithLongSchedule)
			.capture("Building Hours detail sheet before dragging to the larger detent")

		let titleBefore = screen.detailTitleFrame(
			for: TestIdentifiers.BuildingHours.aBuildingWithLongSchedule)

		screen
			.expandDetailSheet()
			.capture("Building Hours detail sheet after dragging to the larger detent")
			.verifyDetailSheetFullyLaidOut(
				for: TestIdentifiers.BuildingHours.aBuildingWithLongSchedule, titleBefore: titleBefore)
	}

	func testDetailSheetMenuOffersReportAProblem() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.openDetailMenu()
			.verifyReportActionOffered()
			.tapReportAction()
			.verifyReportScreenPresented()
			.verifyReportPushedIntoSheet()
			.capture("Building Hours report screen")
			// Presenting a modal while a formSheet is already up can silently
			// no-op on iOS -- dismissing back to the detail sheet, rather than
			// straight to the list, is what proves it actually stacked on top
			// of the sheet instead of replacing it or failing to present.
			.dismissReportScreen()
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
	}
}
