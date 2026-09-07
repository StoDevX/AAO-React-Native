import XCTest

struct BuildingHoursScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.buildingHours)
	}

	@discardableResult
	func verifyBuildingHoursTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.buildingHours)
	}

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Building Hours should offer a search field")
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
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should be listed")
		return self
	}

	@discardableResult
	func verifyRowHidden(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
		XCTAssertTrue(
			row.waitForNonExistence(timeout: 30),
			"\(name) should have been filtered out")
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
			"Building Hours should report no results for \"\(query)\"")
		return self
	}

	@discardableResult
	func tapRow(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should be listed before it can be tapped")

		// Retried for the reason navigateFromHome retries: a synthesized press on
		// a row whose host has mounted but whose action still has to reach
		// JavaScript lands natively and does nothing.
		for _ in 1...3 {
			row.tap()
			if app.staticTexts[TestIdentifiers.BuildingHours.detailSchedule]
				.waitForExistence(timeout: 10)
			{
				break
			}
		}
		return self
	}

	@discardableResult
	func verifyDetailSheetPresented(for name: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[name].waitForExistence(timeout: 30),
			"The detail sheet should be titled \(name)")
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.BuildingHours.detailSchedule]
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
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
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

	/// Assert the sheet is still at its smaller (0.5) detent: the closing
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

	/// Drags the sheet from its half detent up to its larger one, the way
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
		let menu = app.buttons[TestIdentifiers.BuildingHours.detailMenu].firstMatch
		XCTAssertTrue(
			menu.waitForExistence(timeout: 30),
			"The detail sheet should offer an overflow menu")
		menu.tap()
		return self
	}

	@discardableResult
	func verifyReportActionOffered() -> Self {
		XCTAssertTrue(
			app.buttons[TestIdentifiers.BuildingHours.reportAction]
				.waitForExistence(timeout: 30),
			"The menu should offer Report a Problem")
		return self
	}

	/// Taps Report a Problem in the detail sheet's overflow menu. This action
	/// presents a `modal` route on the OUTER stack while a `formSheet` is
	/// already up -- exactly the class of presentation that can silently no-op
	/// on iOS -- so `verifyReportScreenPresented` is what proves it actually
	/// worked rather than merely existing as a menu item.
	@discardableResult
	func tapReportAction() -> Self {
		let action = app.buttons[TestIdentifiers.BuildingHours.reportAction]
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
			app.staticTexts[TestIdentifiers.BuildingHours.reportScreenPrompt]
				.waitForExistence(timeout: 30),
			"Report a Problem should present the report screen")
		return self
	}

	/// Assert the report screen pushed into the sheet's own stack rather than
	/// presenting as a modal over it. `element(boundBy: 0)` alone cannot tell a
	/// back chevron from a close button -- both are just "a button" in the nav
	/// bar -- so this also asserts the close button used by the old modal
	/// route is gone, which the push route's leading button positively is not.
	@discardableResult
	func verifyReportPushedIntoSheet() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.BuildingHours.reportScreenPrompt]
				.waitForExistence(timeout: 30),
			"The report screen should be up")

		XCTAssertFalse(
			app.buttons[TestIdentifiers.Navigation.closeScreen].exists,
			"A pushed screen should not carry the modal's close button")

		let back = app.navigationBars.buttons.element(boundBy: 0)
		XCTAssertTrue(
			back.exists && back.isHittable,
			"The report should push into the sheet's stack, so it carries a back button")
		return self
	}

	/// Dismisses the report screen via its navigation bar's leading button --
	/// a back button, since the report is pushed into the sheet's own stack
	/// rather than presented as a modal.
	@discardableResult
	func dismissReportScreen() -> Self {
		let back = app.navigationBars.buttons.element(boundBy: 0)
		XCTAssertTrue(
			back.waitForExistence(timeout: 30),
			"The report screen should offer a way to go back")
		back.tap()
		return self
	}

	@discardableResult
	func verifyListStillBehind() -> Self {
		let row = app.element(
			matching: TestIdentifiers.BuildingHours.rowPrefix
				+ TestIdentifiers.BuildingHours.anExcludedBuilding)
		XCTAssertTrue(
			row.exists,
			"The list should still be behind the sheet, not replaced by it")
		return self
	}
}
