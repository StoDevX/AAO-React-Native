import XCTest

struct CampusScreen: Screen {
	let app: XCUIApplication

	/// Opens the St. Olaf Campus tile, which defaults to `'stolaf'` with no
	/// `?campus=` param.
	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.campus)
	}

	/// Opens the Carleton Campus tile, which pushes `/Campus?campus=carleton`.
	@discardableResult
	func navigateToCarleton() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.carletonCampus)
	}

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Campus should offer a search field")
		searchField.tap()
		searchField.typeText(text)

		// The field is the one place the typed text is held, so read it back
		// before going on: a test that swiped away from an empty field would
		// pass no matter what the swipe did to it.
		XCTAssertEqual(
			searchField.value as? String, text,
			"Typing should put the query in the search field")
		return self
	}

	@discardableResult
	func verifyRowShown(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.Campus.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should be listed")
		return self
	}

	@discardableResult
	func verifyRowHidden(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.Campus.rowPrefix + name)
		XCTAssertTrue(
			row.waitForNonExistence(timeout: 30),
			"\(name) should have been filtered out")
		return self
	}

	/// Assert the top-right map button is absent. St. Olaf's Campus screen
	/// offers no map button today -- `Buttons.mapButton` is Carleton-only
	/// (`campus === 'carleton'` in `app/(home)/Campus/index.tsx`) -- so this is
	/// what proves that condition still exists, rather than the button having
	/// quietly become unconditional.
	@discardableResult
	func verifyNoMapButton() -> Self {
		XCTAssertFalse(
			app.buttons[TestIdentifiers.Campus.mapButton].firstMatch.waitForExistence(timeout: 5),
			"St. Olaf's Campus screen should not offer a map button")
		return self
	}

	/// Assert the screen reports that `query` matched nothing, as distinct from
	/// the genuine no-data message -- a search with no matches should never
	/// read as a data outage.
	@discardableResult
	func verifyNoResultsShown(for query: String) -> Self {
		let message = app.staticTexts["No results found for \"\(query)\"."]
		XCTAssertTrue(
			message.waitForExistence(timeout: 30),
			"Campus should report no results for \"\(query)\"")
		return self
	}

	@discardableResult
	func tapRow(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.Campus.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should be listed before it can be tapped")

		// Tapped by coordinate, not `row.tap()`: XCUITest's own hittability
		// check can read a just-mounted row as not yet hittable even though it
		// is fully drawn and would take a real tap fine, which would abort the
		// test outright rather than let this loop retry. The row's centre is
		// what `selectBuilding` in CarletonMapScreen taps for the same reason.
		//
		// The loop itself is retried for the reason navigateFromHome retries: a
		// synthesized press on a row whose host has mounted but whose action
		// still has to reach JavaScript lands natively and does nothing.
		//
		// Success is the sheet's own nav-bar title, not `detailSchedule` --
		// that heading's text is a schedule's own title, and not every
		// building titles its schedule "Hours" (Carleton's Sayles Café titles
		// its section "Café").
		for _ in 1...3 {
			row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
			if app.navigationBars.staticTexts[name].waitForExistence(timeout: 10) {
				break
			}
		}
		return self
	}

	/// Asserts the detail sheet's own title is up, without assuming its
	/// schedule section is titled "Hours" the way `verifyDetailSheetPresented`
	/// does -- not every building's schedule uses that title (Carleton's
	/// Sayles Café titles its section "Café"). Scoped to `navigationBars`
	/// rather than a bare `staticTexts` lookup: the building's name is also a
	/// list row's own label, which never goes away.
	@discardableResult
	func verifyDetailSheetTitled(_ name: String) -> Self {
		XCTAssertTrue(
			app.navigationBars.staticTexts[name].waitForExistence(timeout: 30),
			"The detail sheet should be titled \(name)")
		return self
	}

	@discardableResult
	func verifyDetailSheetPresented(for name: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[name].waitForExistence(timeout: 30),
			"The detail sheet should be titled \(name)")
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Campus.detailSchedule]
				.waitForExistence(timeout: 30),
			"The detail sheet should show \(name)'s schedule")
		return self
	}

	/// The on-screen frame of the sheet's own title, at whatever detent it is
	/// currently at. The title sits in the nested stack's nav bar, outside the
	/// SwiftUI `List` that scrolls beneath it, so this only moves when the
	/// sheet's detent changes -- never when the list inside it merely scrolls.
	func detailTitleFrame(for name: String) -> CGRect {
		app.staticTexts[name].firstMatch.frame
	}

	/// Taps a different building's row while the detail sheet is up, via its
	/// own screen coordinate rather than `XCUIElement.tap()` -- this row is
	/// expected NOT to respond once the sheet dims the list behind it, and a
	/// plain `.tap()` would fail the test outright for not being hittable,
	/// which is a different claim than the one this test makes.
	@discardableResult
	func attemptToTapRowBehindSheet(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.Campus.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should still be in the list behind the sheet")
		row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
		return self
	}

	/// Assert Stav Hall's own detail content -- a schedule section heading
	/// (its meal periods) that no other screen here shows -- never appeared.
	/// That is the tell for a second sheet having stacked over the first: a
	/// tap that reached Stav Hall's row rather than being blocked by the
	/// dimmed backdrop would push its own detail sheet, showing "BREAKFAST".
	///
	/// Whether the tap also dismissed whatever sheet was already up is not
	/// asserted here -- tapping a dimmed backdrop dismissing the sheet in
	/// front of it is ordinary, expected sheet behaviour, distinct from the
	/// bug this test guards against.
	@discardableResult
	func verifyNoSecondSheetForStavHall() -> Self {
		XCTAssertFalse(
			app.staticTexts["BREAKFAST"].waitForExistence(timeout: 5),
			"Stav Hall's own detail content should never have appeared -- its row's tap should "
				+ "have been blocked by the dimmed sheet behind it, not reached through to stack a "
				+ "second sheet")
		return self
	}

	/// Assert the sheet is still at its smaller detent: the closing
	/// footnote, the last thing on the detail screen, is not yet reachable --
	/// whether because it exists but sits off-screen, or because the SwiftUI
	/// `List` has not mounted content that far below the fold yet. Either way
	/// it cannot be tapped, which is what "not yet reachable" means here.
	///
	/// This is `expandDetailSheet`'s precondition, not just a standalone check
	/// -- without it, the drag it guards could pass for a sheet that opened
	/// straight at the larger detent, or for a building whose schedule already
	/// fits the smaller one, and the whole test would prove nothing.
	@discardableResult
	func verifyDetailSheetAtSmallDetent() -> Self {
		let footnote = app.elementWithLabel(startingWith: "Building hours subject to change")
		XCTAssertFalse(
			footnote.exists && footnote.isHittable,
			"The footnote should not be reachable at the smaller detent -- if it is, this "
				+ "building's schedule no longer has enough content to make this test meaningful")
		return self
	}

	/// Drags the sheet from its smaller detent up to its larger one, the way
	/// `CarletonMapScreen.expandSheet` drags the map's building sheet.
	@discardableResult
	func expandDetailSheet() -> Self {
		verifyDetailSheetAtSmallDetent()
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.93))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)))
		return self
	}

	/// Assert the sheet's last element -- the disclaimer footnote at the very
	/// bottom of the detail screen -- is hittable after expanding to the
	/// larger detent, AND that the sheet's own title has moved: the title sits
	/// in the nested stack's nav bar, outside the SwiftUI `List` that scrolls,
	/// so only a detent change moves it, never a scroll of the list beneath it.
	///
	/// The footnote check alone cannot tell a detent change from a scroll --
	/// dragging from inside the `List`'s own content, which is where this
	/// gesture starts, can scroll the list to the same visible end state
	/// `RNSScreenContentWrapper` resizing it would produce. The title check is
	/// what proves the detent actually changed: `RNSScreenContentWrapper` only
	/// resizes a direct `RCTScrollViewComponentView` child, and a SwiftUI
	/// `Host`/`List` is not one, so this is the test that would catch content
	/// stuck laid out at the smaller detent's height instead of the larger
	/// one's.
	@discardableResult
	func verifyDetailSheetFullyLaidOut(for name: String, titleBefore: CGRect) -> Self {
		let footnote = app.elementWithLabel(startingWith: "Building hours subject to change")
		XCTAssertTrue(
			footnote.waitForExistence(timeout: 30) && footnote.isHittable,
			"The sheet's closing footnote should be reachable once expanded to the larger detent")

		let titleAfter = detailTitleFrame(for: name)
		XCTAssertTrue(
			titleBefore.minY - titleAfter.minY > 100,
			"The sheet's title should have moved up well past a scroll's worth once the "
				+ "detent actually changed, from \(titleBefore.minY) to \(titleAfter.minY)")
		return self
	}

	@discardableResult
	func openDetailMenu() -> Self {
		let menu = app.buttons[TestIdentifiers.Campus.detailMenu].firstMatch
		XCTAssertTrue(
			menu.waitForExistence(timeout: 30),
			"The detail sheet should offer an overflow menu")
		menu.tap()
		return self
	}

	@discardableResult
	func verifyReportActionOffered() -> Self {
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Campus.reportAction]
				.waitForExistence(timeout: 30),
			"The menu should offer Report a Problem")
		return self
	}

	/// Taps Report a Problem in the detail sheet's overflow menu.
	/// `verifyReportScreenPresented` is what proves the push actually worked,
	/// rather than the action merely existing as a menu item.
	@discardableResult
	func tapReportAction() -> Self {
		let action = app.buttons[TestIdentifiers.Campus.reportAction]
		XCTAssertTrue(
			action.waitForExistence(timeout: 30),
			"The menu should offer Report a Problem before it can be tapped")
		action.tap()
		return self
	}

	/// Assert the report screen actually came up, by its own `InfoHeader`
	/// prompt rather than `reportAction`'s label -- that label belongs to the
	/// menu button that opens this screen, and would exist whether or not the
	/// screen ever presented.
	@discardableResult
	func verifyReportScreenPresented() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Campus.reportScreenPrompt]
				.waitForExistence(timeout: 30),
			"Report a Problem should present the report screen")
		return self
	}

	/// Assert the report screen's submit control is on screen and can be tapped
	/// the moment the screen appears.
	///
	/// `isHittable`, not `exists`: the control used to be the last cell of a
	/// form whose length grows with every schedule a venue has, inside a sheet
	/// that shows about half a screen -- so it existed in the hierarchy while
	/// being off-screen for the venues that need it most. Sending the report
	/// itself hands off to the system mail composer, which is outside the app
	/// and outside what this can assert; that it can be reached at all is the
	/// part that broke.
	@discardableResult
	func verifySubmitReportReachable() -> Self {
		let submit = app.navigationBars.buttons[TestIdentifiers.BuildingHours.submitReportAction]
		XCTAssertTrue(
			submit.waitForExistence(timeout: 30),
			"The report screen should offer Submit Report")
		XCTAssertTrue(
			submit.isHittable,
			"Submit Report should be reachable without scrolling the form")
		return self
	}

	/// Assert the report screen pushed into the sheet's own stack rather than
	/// presenting as a modal over it. Queried by the back button's own label
	/// rather than `element(boundBy: 0)` -- the list's nav bar is still in the
	/// hierarchy behind the sheet, so an unscoped positional query can match
	/// the wrong bar's button. The back button carrying the sheet's own label
	/// is the actual discriminator: a modal presented on the outer stack would
	/// not carry a back button that pops into the sheet's nested stack.
	@discardableResult
	func verifyReportPushedIntoSheet() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Campus.reportScreenPrompt]
				.waitForExistence(timeout: 30),
			"The report screen should be up")

		let back = app.navigationBars.buttons[TestIdentifiers.Navigation.backButton]
		XCTAssertTrue(
			back.exists && back.isHittable,
			"The report should push into the sheet's stack, so it carries a back button")

		return self
	}

	/// Dismisses the report screen via its own back button. Queried by label
	/// rather than position -- see `verifyReportPushedIntoSheet`.
	@discardableResult
	func dismissReportScreen() -> Self {
		let back = app.navigationBars.buttons[TestIdentifiers.Navigation.backButton]
		XCTAssertTrue(
			back.waitForExistence(timeout: 30),
			"The report screen should offer a way to go back")
		back.tap()
		return self
	}

	/// Types a change into the report screen's Name field, the simplest way to
	/// put the unsaved-changes guard into its "armed" state.
	@discardableResult
	func makeUnsavedEditOnReportScreen() -> Self {
		let nameField = app.textFields.firstMatch
		XCTAssertTrue(nameField.waitForExistence(timeout: 30), "The report screen should have a Name field")
		nameField.tap()
		nameField.typeText(" edited")
		return self
	}

	private var discardChangesAlert: XCUIElement {
		app.alerts["Discard changes?"]
	}

	@discardableResult
	func verifyDiscardChangesAlertPresented() -> Self {
		XCTAssertTrue(
			discardChangesAlert.waitForExistence(timeout: 15),
			"The unsaved-changes guard should have raised its alert")
		return self
	}

	@discardableResult
	func verifyNoDiscardChangesAlertPresented() -> Self {
		XCTAssertFalse(
			discardChangesAlert.waitForExistence(timeout: 5),
			"No alert should appear -- this gesture should have been a no-op")
		return self
	}

	/// Cancels the discard, staying on the screen with edits intact.
	@discardableResult
	func chooseToKeepEditing() -> Self {
		discardChangesAlert.buttons["Edit"].tap()
		return self
	}

	/// Confirms the discard, letting the pending navigation go through.
	@discardableResult
	func chooseToDiscardChanges() -> Self {
		discardChangesAlert.buttons["Discard"].tap()
		return self
	}

	/// Attempts to drag the detail sheet closed from inside the report screen,
	/// the same drag `expandDetailSheet` uses to change detents, but downward
	/// and past the bottom of the screen so it asks UIKit to dismiss the sheet
	/// entirely rather than merely shrink it.
	@discardableResult
	func attemptToDragSheetClosed() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.4))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 1.05)))
		return self
	}

	/// Assert the report screen -- and, since a discarded sheet dismissal
	/// closes the whole formSheet rather than just popping the report screen,
	/// the sheet itself -- is gone. Checking only `reportScreenPrompt` would
	/// pass equally for a plain pop back to the building detail screen, with
	/// the sheet still up behind it -- so this also asserts the sheet's own
	/// title is gone, which only a real dismissal of the formSheet produces.
	/// Scoped to `navigationBars` rather than a bare `staticTexts` lookup: the
	/// building's name is also a list row's own label, which never goes away.
	@discardableResult
	func verifyReportScreenGone(buildingName: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Campus.reportScreenPrompt]
				.waitForNonExistence(timeout: 15),
			"Confirming the discard should have let the dismissal go through")
		XCTAssertTrue(
			app.navigationBars.staticTexts[buildingName].waitForNonExistence(timeout: 15),
			"The sheet itself, titled \(buildingName), should have closed too, not just popped "
				+ "back to it")
		return self
	}

	/// Opens `BuildingHoursScheduleEditor` from one of the report screen's
	/// editable hours rows -- "Weekdays" on `anExcludedBuilding`'s schedule.
	/// The row is a single Pressable carrying a concatenated label (title and
	/// detail together, e.g. "Weekdays, 7:30 AM — 8:00 PM"), not a standalone
	/// "Weekdays" text, hence the prefix match.
	@discardableResult
	func openScheduleEditorFromReportScreen() -> Self {
		let weekdaysRow = app.elementWithLabel(startingWith: "Weekdays")
		XCTAssertTrue(
			weekdaysRow.waitForExistence(timeout: 15),
			"The report screen should list an editable Weekdays row")
		weekdaysRow.tap()
		return self
	}

	@discardableResult
	func verifyScheduleEditorPresented() -> Self {
		XCTAssertTrue(
			app.staticTexts["Edit Schedule"].waitForExistence(timeout: 15),
			"Tapping a schedule row should present the schedule editor")
		return self
	}

	/// Taps the dimmed backdrop above the sheet -- the list behind it, which
	/// `sheetLargestUndimmedDetentIndex: 'none'` keeps dimmed and untouchable
	/// at every detent. A normal sheet dismisses on this tap; the guard should
	/// refuse it the same as a drag.
	@discardableResult
	func attemptToTapDimmedBackdrop() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.1)).tap()
		return self
	}

	/// Distinguishes a sheet from a full-screen push: a pushed screen replaces
	/// the list in the hierarchy, while a sheet leaves it present underneath.
	/// `XCUIElement.exists` is true for a merely-covered element as much as a
	/// visible one, so this does NOT tell a sheet apart from a modal that
	/// covers the list -- react-native-screens' `modal` is a pageSheet that
	/// also leaves the list in the hierarchy. Only meaningful where the
	/// alternative under test is a full-screen push.
	@discardableResult
	func verifyListStillBehind() -> Self {
		let row = app.element(
			matching: TestIdentifiers.Campus.rowPrefix
				+ TestIdentifiers.Campus.anExcludedBuilding)
		XCTAssertTrue(
			row.exists,
			"The list should still be behind the sheet, not replaced by it")
		return self
	}

	/// Assert the detail sheet itself -- not just whatever screen was pushed
	/// inside it -- has closed, by its own title going away. Scoped to
	/// `navigationBars` rather than a bare `staticTexts` lookup: the building's
	/// name is also a list row's own label, which never goes away.
	@discardableResult
	func verifyDetailSheetGone(for name: String) -> Self {
		XCTAssertTrue(
			app.navigationBars.staticTexts[name].waitForNonExistence(timeout: 15),
			"The detail sheet, titled \(name), should have closed")
		return self
	}
}
