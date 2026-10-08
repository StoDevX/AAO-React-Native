import XCTest

class ModuleHoursTests: UITestCaseUnbooted {
	/// A query typed into the search bar narrows the list, and one that
	/// matches nothing says so.
	func testSearchNarrowsTheListToNothing() throws {
		HoursScreen(app: app)
			.navigate()
			.verifyRowShown(TestIdentifiers.Hours.anExcludedBuilding)
			.search(for: TestIdentifiers.Hours.unmatchedQuery)
			.verifyRowHidden(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyNoResultsShown(for: TestIdentifiers.Hours.unmatchedQuery)
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
			.tapAddToFavorites()
			.verifyFavoritesSectionShown()
	}

	/// A detail sheet's whole life with no edits: it opens over the list, its
	/// Report a Problem button pushes the report into the sheet's own stack, the
	/// report opens the schedule editor, and the sheet still closes afterwards.
	///
	/// Dismissing the report back to the detail sheet, rather than straight to
	/// the list, is what proves the report pushed into the sheet's own stack
	/// instead of replacing it.
	///
	/// The schedule editor is a push in that same stack, so the two can share
	/// the draft they both edit. A `modal` on the outer stack can silently do
	/// nothing while a formSheet is up, so the editor has to be seen to open.
	///
	/// Besides its Close button, the sheet closes by drag and backdrop.
	/// `preventNativeDismiss` on the report route makes the drag worth proving
	/// directly: a `preventedRoutes` entry that outlived the report screen
	/// would trap the user in a sheet nothing could close.
	func testTheDetailSheetLeadsToReportAndStillCloses() throws {
		HoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.tapReportAction()
			.verifyReportScreenPresented()
			.verifyReportPushedIntoSheet()
			.verifySubmitReportReachable()
			.openScheduleEditorFromReportScreen()
			.verifyScheduleEditorPresented()
			.goBack()
			.verifyReportScreenPresented()
			.dismissReportScreen()
			.verifyNoDiscardChangesAlertPresented()
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.attemptToDragSheetClosed()
			.verifyDetailSheetGone(for: TestIdentifiers.Hours.anExcludedBuilding)
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

		let titleBefore = screen.detailTitleFrame(
			for: TestIdentifiers.Hours.aBuildingWithLongSchedule)

		screen
			.expandDetailSheet()
			.verifyDetailSheetFullyLaidOut(
				for: TestIdentifiers.Hours.aBuildingWithLongSchedule, titleBefore: titleBefore)
	}

	// The report screen's unsaved-changes guard has to survive every way out,
	// not just the ones a plain `beforeRemove` listener can see. Dragging the
	// sheet down or tapping its dimmed backdrop asks UIKit to dismiss the
	// *formSheet* natively -- a level up from the report screen's own pushed
	// stack -- which `beforeRemove` alone cannot refuse. This is the scenario
	// that motivated moving the guard to `usePreventRemove`. One test per way
	// out.

	/// The back button: cancelling keeps the edit and the report screen up.
	func testUnsavedChangesGuardHoldsAgainstTheBackButton() throws {
		openReportWithAnUnsavedEdit()
			.dismissReportScreen()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyReportScreenPresented()
	}

	/// Dragging the sheet closed attempts a native dismissal of the whole
	/// formSheet, not just a pop of the report screen -- the path the
	/// Critical this test guards against found unguarded.
	func testUnsavedChangesGuardHoldsAgainstDraggingTheSheetDown() throws {
		openReportWithAnUnsavedEdit()
			.attemptToDragSheetClosed()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyReportScreenPresented()
	}

	/// The dimmed backdrop is the sheet's other native dismissal path.
	/// Confirming the discard proves the guard's "let it go" branch still
	/// actually lets the sheet close, rather than the guard having
	/// accidentally made the sheet undismissable outright.
	func testUnsavedChangesGuardLetsTheBackdropDiscardTheEdit() throws {
		openReportWithAnUnsavedEdit()
			.attemptToTapDimmedBackdrop()
			.verifyDiscardChangesAlertPresented()
			.chooseToDiscardChanges()
			.verifyReportScreenGone(buildingName: TestIdentifiers.Hours.anExcludedBuilding)
	}

	/// Opens a building's report screen from its detail sheet and leaves an
	/// edit unsaved on it.
	private func openReportWithAnUnsavedEdit() -> HoursScreen {
		HoursScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Hours.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Hours.anExcludedBuilding)
			.tapReportAction()
			.verifyReportScreenPresented()
			.makeUnsavedEditOnReportScreen()
	}
}
