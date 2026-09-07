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
			// Dismissing back to the detail sheet, rather than straight to the
			// list, is what proves the report pushed into the sheet's own
			// stack instead of replacing it.
			.dismissReportScreen()
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
	}

	/// The report screen's unsaved-changes guard has to survive every way out,
	/// not just the ones a plain `beforeRemove` listener can see. Dragging the
	/// sheet down or tapping its dimmed backdrop asks UIKit to dismiss the
	/// *formSheet* natively -- a level up from the report screen's own pushed
	/// stack -- which `beforeRemove` alone cannot refuse. This is the scenario
	/// that motivated moving the guard to `usePreventRemove`.
	func testUnsavedChangesGuardSurvivesEveryWayToLeave() throws {
		let screen = BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.openDetailMenu()
			.tapReportAction()
			.verifyReportScreenPresented()
			.makeUnsavedEditOnReportScreen()

		// The back button: cancelling keeps the edit and the report screen up.
		screen
			.dismissReportScreen()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyReportScreenPresented()

		// Dragging the sheet closed attempts a native dismissal of the whole
		// formSheet, not just a pop of the report screen -- the path the
		// Critical this test guards against found unguarded.
		screen
			.attemptToDragSheetClosed()
			.verifyDiscardChangesAlertPresented()
			.capture("Building Hours guard blocks a sheet drag")
			.chooseToKeepEditing()
			.verifyReportScreenPresented()

		// The dimmed backdrop is the sheet's other native dismissal path.
		// Confirming the discard this time proves the guard's "let it go"
		// branch still actually lets the sheet close, rather than the guard
		// having accidentally made the sheet undismissable outright.
		screen
			.attemptToTapDimmedBackdrop()
			.verifyDiscardChangesAlertPresented()
			.chooseToDiscardChanges()
			.verifyReportScreenGone()
	}

	/// `BuildingHoursScheduleEditor` still presents as a `modal` on the OUTER
	/// stack, pushed from the report screen two levels inside the formSheet.
	/// A modal presented while a formSheet is already up is exactly the class
	/// of presentation this task moved Report a Problem off of because it can
	/// silently no-op on iOS -- this asserts whether the editor actually comes
	/// up from its new, deeper starting point.
	func testScheduleEditorPresentsFromWithinTheReportScreen() throws {
		BuildingHoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.BuildingHours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.BuildingHours.anExcludedBuilding)
			.openDetailMenu()
			.tapReportAction()
			.verifyReportScreenPresented()
			.openScheduleEditorFromReportScreen()
			.capture("Building Hours schedule editor opened from the report screen")
			.verifyScheduleEditorPresented()
	}
}
