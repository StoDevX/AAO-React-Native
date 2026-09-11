import XCTest

class ModuleCampusTests: UITestCase {
	/// The campus parameter, not just the route, has to actually select the
	/// venue list: `carletonBuilding` exists in Carleton's `spaces/hours` but
	/// not St. Olaf's, so this fails if the Carleton tile's `?campus=carleton`
	/// were ignored and St. Olaf's list loaded instead.
	///
	/// The reverse direction matters too: `aBuilding` (Rølvaag Library) is
	/// St. Olaf-only, so also asserting its absence here is what would fail if
	/// the two campuses' lists were ever merged rather than kept separate.
	func testCarletonTileShowsCarletonVenues() throws {
		CampusScreen(app: app)
			.navigateToCarleton()
			.verifyTitle(TestIdentifiers.Buttons.carletonCampus)
			.verifyRowShown(TestIdentifiers.Campus.carletonBuilding)
			.verifyRowHidden(TestIdentifiers.Campus.aBuilding)
	}

	/// The map now serves both campuses -- St. Olaf's Campus screen offers the
	/// same map button Carleton's already had, and it has to open St. Olaf's
	/// own map data. `aStolafBuilding` is absent from Carleton's map, so this
	/// fails if the button forwarded the wrong campus, or none at all, to
	/// `/Map`.
	func testStolafMapButtonOpensStolafMap() throws {
		CarletonMapScreen(app: app)
			.navigate(from: TestIdentifiers.Buttons.campus)
			.checkSheetPresented()
			.capture("St. Olaf map with its building sheet")
			.expandSheet()
			.selectBuilding(named: TestIdentifiers.CarletonMap.aStolafBuilding)
			.checkBuildingCardPresented()
			.capture("St. Olaf map showing a building's card")
	}

	/// Every other detail-sheet test in this file goes through St. Olaf's
	/// tile. This is the one that proves the `campus` param actually survives
	/// the push into `/Campus/detail/[name]` for a Carleton venue too, rather
	/// than the sheet only ever having been exercised for St. Olaf.
	func testTappingACarletonRowPresentsItsDetailSheet() throws {
		CampusScreen(app: app)
			.navigateToCarleton()
			.tapRow(TestIdentifiers.Campus.carletonBuilding)
			.verifyDetailSheetTitled(TestIdentifiers.Campus.carletonBuilding)
	}

	func testSearchNarrowsTheList() throws {
		CampusScreen(app: app)
			.navigate()
			.verifyRowShown(TestIdentifiers.Campus.anExcludedBuilding)
			.search(for: TestIdentifiers.Campus.deburredQuery)
			.verifyRowShown(TestIdentifiers.Campus.aBuilding)
			.verifyRowHidden(TestIdentifiers.Campus.anExcludedBuilding)
	}

	func testSearchWithNoMatchesShowsNoResults() throws {
		CampusScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Campus.unmatchedQuery)
			.verifyNoResultsShown(for: TestIdentifiers.Campus.unmatchedQuery)
			.capture("Campus no-results state")
	}

	func testTappingARowPresentsTheDetailSheet() throws {
		CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.verifyListStillBehind()
			.capture("Campus detail sheet at the smaller detent")
	}

	/// `sheetLargestUndimmedDetentIndex: 'none'` is what makes this true: UIKit
	/// dims and blocks touches to the list behind the sheet at every detent,
	/// not merely below the largest one. Without it, a tap on a different
	/// building's row lands on the list and pushes a second detail sheet on
	/// top of the first.
	func testTappingARowBehindTheSheetDoesNotStackASecondSheet() throws {
		CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.attemptToTapRowBehindSheet(TestIdentifiers.Campus.aSecondBuilding)
			.capture("Campus after tapping a row behind the sheet")
			.verifyNoSecondSheetForStavHall()
	}

	/// `aBuildingWithLongSchedule` has two schedule sections plus a resource
	/// link -- enough combined content to overflow the sheet's smaller detent,
	/// unlike `anExcludedBuilding`'s single short section, which already fits
	/// it entirely. Dragging it open is the case that would catch content
	/// stuck laid out at the smaller detent's height.
	func testDraggingTheDetailSheetRevealsTheRestOfItsContent() throws {
		let screen = CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.aBuildingWithLongSchedule)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.aBuildingWithLongSchedule)
			.capture("Campus detail sheet before dragging to the larger detent")

		let titleBefore = screen.detailTitleFrame(
			for: TestIdentifiers.Campus.aBuildingWithLongSchedule)

		screen
			.expandDetailSheet()
			.capture("Campus detail sheet after dragging to the larger detent")
			.verifyDetailSheetFullyLaidOut(
				for: TestIdentifiers.Campus.aBuildingWithLongSchedule, titleBefore: titleBefore)
	}

	/// Registrar's `building` key (`toh`) resolves to a feature named Tomson
	/// Hall, not Registrar -- so this only passes if the cutout actually joined
	/// on the key, rather than coincidentally matching a feature sharing the
	/// venue's own name. See `TestIdentifiers.Campus.aBuildingWithCutout`.
	func testDetailSheetShowsACutoutMapForAVenueWithABuildingKey() throws {
		CampusScreen(app: app)
			.navigate()
			// Registrar's category sits well below the list's initial viewport,
			// so it is searched into view rather than assumed reachable the way
			// `anExcludedBuilding` and its Food-category neighbours are.
			.search(for: TestIdentifiers.Campus.aBuildingWithCutout)
			.tapRow(TestIdentifiers.Campus.aBuildingWithCutout)
			.verifyDetailSheetTitled(TestIdentifiers.Campus.aBuildingWithCutout)
			.verifyCutoutShown(for: TestIdentifiers.Campus.aBuildingWithCutoutFrames)
			.capture("Campus detail sheet showing a building cutout")
	}

	/// Every Carleton venue carries no `building` key -- its hours data lives
	/// outside this repo -- so the absence of a cutout has to read as
	/// deliberate, not as a broken map that silently failed to draw.
	func testDetailSheetShowsNoCutoutForACarletonVenue() throws {
		CampusScreen(app: app)
			.navigateToCarleton()
			.tapRow(TestIdentifiers.Campus.carletonBuilding)
			.verifyDetailSheetTitled(TestIdentifiers.Campus.carletonBuilding)
			.verifyNoCutoutShown()
			.capture("Campus detail sheet for a Carleton venue, with no cutout")
	}

	func testDetailSheetMenuOffersReportAProblem() throws {
		CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.openDetailMenu()
			.verifyReportActionOffered()
			.tapReportAction()
			.verifyReportScreenPresented()
			.verifyReportPushedIntoSheet()
			.verifySubmitReportReachable()
			.capture("Campus report screen")
			// Dismissing back to the detail sheet, rather than straight to the
			// list, is what proves the report pushed into the sheet's own
			// stack instead of replacing it.
			.dismissReportScreen()
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
	}

	/// The detail sheet offers no close control of its own -- only an overflow
	/// menu and a favourite button -- so drag and backdrop are its only exits.
	/// `preventNativeDismiss` on the report route makes this worth proving
	/// directly: a `preventedRoutes` entry that outlived the report screen
	/// would trap the user in a sheet nothing could close. This goes back with
	/// no edits (so no alert should appear) and then drags the sheet itself
	/// closed, confirming the exit still works once the report route is gone.
	func testDismissingTheDetailSheetAfterVisitingReportWithNoEditsWorks() throws {
		CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.openDetailMenu()
			.tapReportAction()
			.verifyReportScreenPresented()
			.dismissReportScreen()
			.verifyNoDiscardChangesAlertPresented()
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.attemptToDragSheetClosed()
			.verifyDetailSheetGone(for: TestIdentifiers.Campus.anExcludedBuilding)
	}

	/// The report screen's unsaved-changes guard has to survive every way out,
	/// not just the ones a plain `beforeRemove` listener can see. Dragging the
	/// sheet down or tapping its dimmed backdrop asks UIKit to dismiss the
	/// *formSheet* natively -- a level up from the report screen's own pushed
	/// stack -- which `beforeRemove` alone cannot refuse. This is the scenario
	/// that motivated moving the guard to `usePreventRemove`.
	func testUnsavedChangesGuardSurvivesEveryWayToLeave() throws {
		let screen = CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
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
			.capture("Campus guard blocks a sheet drag")
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
			.verifyReportScreenGone(buildingName: TestIdentifiers.Campus.anExcludedBuilding)
	}

	/// The schedule editor is a push inside the formSheet's own stack, next to
	/// the report screen it opens from, so that the two can share the draft
	/// they both edit. It used to be a `modal` on the OUTER stack -- a
	/// presentation that can silently no-op on iOS while a formSheet is
	/// already up -- so this asserts the editor really does come up.
	func testScheduleEditorPresentsFromWithinTheReportScreen() throws {
		CampusScreen(app: app)
			.navigate()
			.tapRow(TestIdentifiers.Campus.anExcludedBuilding)
			.verifyDetailSheetPresented(for: TestIdentifiers.Campus.anExcludedBuilding)
			.openDetailMenu()
			.tapReportAction()
			.verifyReportScreenPresented()
			.openScheduleEditorFromReportScreen()
			.capture("Campus schedule editor opened from the report screen")
			.verifyScheduleEditorPresented()
	}
}
