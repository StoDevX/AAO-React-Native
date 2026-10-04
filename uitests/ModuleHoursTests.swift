import XCTest

class ModuleHoursTests: UITestCaseUnbooted {
	/// A query narrows the list, matching a name typed without its accents,
	/// and refined until nothing matches, the list says so.
	func testSearchNarrowsTheListToNothing() throws {
		let screen = HoursScreen(app: app)
			.navigate()
			.verifyRowShown(TestIdentifiers.Hours.anExcludedBuilding)
			.search(for: TestIdentifiers.Hours.deburredQuery)
			.verifyRowShown(TestIdentifiers.Hours.aBuilding)
			.verifyRowHidden(TestIdentifiers.Hours.anExcludedBuilding)
		let query = screen.refineSearch(adding: TestIdentifiers.Hours.unmatchedQuery)
		screen
			.verifyNoResultsShown(for: query)
			.capture("Hours no-results state")
	}

	/// The favourite action lives in a SwiftUI `swipeActions` group, which is
	/// drawn only once a row has been swiped. Jest's stand-in for `@expo/ui`
	/// renders nothing for it, on purpose -- there is no gesture in Jest to
	/// reveal it with -- so this is the only place the action is exercised at
	/// all.
	func testSwipingARowFavoritesTheBuilding() throws {
		HoursScreen(app: app)
			.navigate()
			.verifyRowShown(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyFavoritesSectionAbsent()
			.revealSwipeAction(on: TestIdentifiers.Hours.anExcludedBuilding)
			.capture("Hours row swiped to reveal its favorite action")
			.tapAddToFavorites()
			.capture("Hours list with a Favorites section")
			.verifyFavoritesSectionShown()
	}

	/// A detail sheet's whole life with no edits: it opens over the list, its
	/// Report a Problem button pushes the report into the sheet's own stack, and
	/// the sheet still closes afterwards.
	///
	/// Dismissing the report back to the detail sheet, rather than straight to
	/// the list, is what proves the report pushed into the sheet's own stack
	/// instead of replacing it.
	///
	/// Besides its Close button, the sheet closes by drag and backdrop.
	/// `preventNativeDismiss` on the report route makes the drag worth proving
	/// directly: a `preventedRoutes` entry that outlived the report screen
	/// would trap the user in a sheet nothing could close.
	///
	/// Tapping a row behind the sheet comes last, on a sheet opened afresh,
	/// because that tap is allowed to dismiss the sheet.
	/// `sheetLargestUndimmedDetentIndex: 'none'` is what makes it safe: UIKit
	/// dims and blocks touches to the list behind the sheet at every detent,
	/// not merely below the largest one. Without it, a tap on a different
	/// building's row lands on the list and pushes a second detail sheet on
	/// top of the first.
	func testTheDetailSheetLeadsToReportAndStillCloses() throws {
		HoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.verifyListStillBehind()
			.capture("Hours detail sheet at the smaller detent")
			.tapReportAction()
			.verifyReportScreenPresented()
			.verifyReportPushedIntoSheet()
			.verifySubmitReportReachable()
			.capture("Hours report screen")
			.dismissReportScreen()
			.verifyNoDiscardChangesAlertPresented()
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.attemptToDragSheetClosed()
			.verifyDetailSheetGone(for: TestIdentifiers.Hours.anExcludedBuilding)
			.tapRow(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.attemptToTapRowBehindSheet(TestIdentifiers.Hours.aSecondBuilding)
			.capture("Hours after tapping a row behind the sheet")
			.verifyNoSecondSheetForStavHall()
	}

	/// `aBuildingWithLongSchedule` has three schedule sections -- enough
	/// combined content to overflow the sheet's smaller detent,
	/// unlike `anExcludedBuilding`'s single short section, which already fits
	/// it entirely. Dragging it open is the case that would catch content
	/// stuck laid out at the smaller detent's height.
	func testDraggingTheDetailSheetRevealsTheRestOfItsContent() throws {
		let screen = HoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Hours.aBuildingWithLongSchedule)
			.verifyDetailSheetTitled(TestIdentifiers.Hours.aBuildingWithLongSchedule)
			.capture("Hours detail sheet before dragging to the larger detent")

		let titleBefore = screen.detailTitleFrame(
			for: TestIdentifiers.Hours.aBuildingWithLongSchedule)

		screen
			.expandDetailSheet()
			.capture("Hours detail sheet after dragging to the larger detent")
			.verifyDetailSheetFullyLaidOut(
				for: TestIdentifiers.Hours.aBuildingWithLongSchedule, titleBefore: titleBefore)
	}

	/// The report screen's unsaved-changes guard has to survive every way out,
	/// not just the ones a plain `beforeRemove` listener can see. Dragging the
	/// sheet down or tapping its dimmed backdrop asks UIKit to dismiss the
	/// *formSheet* natively -- a level up from the report screen's own pushed
	/// stack -- which `beforeRemove` alone cannot refuse. This is the scenario
	/// that motivated moving the guard to `usePreventRemove`.
	///
	/// First, before any edit, the schedule editor comes up from the report
	/// screen. It is a push inside the formSheet's own stack, next to the
	/// report screen, so that the two can share the draft they both edit. It
	/// used to be a `modal` on the OUTER stack -- a presentation that can
	/// silently no-op on iOS while a formSheet is already up.
	func testUnsavedChangesGuardSurvivesEveryWayToLeave() throws {
		let screen = HoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.tapReportAction()
			.verifyReportScreenPresented()
			.openScheduleEditorFromReportScreen()
			.capture("Hours schedule editor opened from the report screen")
			.verifyScheduleEditorPresented()
			.goBack()
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
			.capture("Hours guard blocks a sheet drag")
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
			.verifyReportScreenGone(buildingName: TestIdentifiers.Hours.anExcludedBuilding)
	}
}
