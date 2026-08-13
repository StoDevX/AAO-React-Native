import XCTest

struct CarletonMapScreen: Screen {
	let app: XCUIApplication

	/// The picker sheet's search field, which is the sheet's only content at
	/// the collapsed detent it opens at.
	private var searchField: XCUIElement {
		app.textFields[TestIdentifiers.CarletonMap.search].firstMatch
	}

	/// The map's home tile is `devOnly`, so it is absent from the home screen
	/// until the dev-mode override is set -- and `--reset-state` clears that
	/// override before every test, so it has to be set here rather than once.
	/// The notice's context menu is the same path
	/// `testLongPressNoticeTogglesDevMode` walks.
	@discardableResult
	func navigate() -> Self {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.longPressNotice()
			.tapEnableDevMode()
		navigateFromHome(to: TestIdentifiers.Buttons.carletonMap)
		return self
	}

	/// The map draws through MapLibre, which XCUITest cannot see into, so the
	/// sheet over it is what tells us the screen came up.
	@discardableResult
	func checkSheetPresented() -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 60),
			"The map should present its building sheet")
		return self
	}

	/// Drags the sheet from its collapsed detent up to full height, where the
	/// building list is.
	@discardableResult
	func expandSheet() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.93))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(
					withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)))
		return self
	}

	/// Taps a named row rather than the first button on screen, which is the
	/// navigation bar's rather than the list's.
	///
	/// Retried, for the reason `navigateFromHome` retries: a synthesized press
	/// on a row whose host has mounted but whose action still has to reach
	/// JavaScript lands natively and does nothing. The row is found, the event
	/// is delivered, and the sheet stays on the list. Waiting longer does not
	/// help a dropped tap; tapping again does.
	@discardableResult
	func selectBuilding(named name: String) -> Self {
		let row = app.buttons[name].firstMatch
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"The expanded sheet should list \(name)")

		let close = app.buttons[TestIdentifiers.CarletonMap.close].firstMatch
		for attempt in 1...3 {
			// Over the name, not the row's centre. A SwiftUI button's hit region
			// comes from what its label draws, and this label is a name, a
			// Spacer and a chevron -- so the empty middle of the row, which is
			// most of its width, does not respond. `tap()` uses the reported
			// centre and lands there, which is why it never opened the card.
			//
			// That gap is the app's, not the test's: a `contentShape` on the row
			// is the fix and does not currently take effect through @expo/ui.
			// Tapping the name is what a user does anyway.
			row.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.5)).tap()
			if close.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(attempt) on \(name) did not open its card; retrying"
			) { _ in }
		}

		XCTFail("Tapping \(name) never opened its card")
		return self
	}

	@discardableResult
	func checkBuildingCardPresented() -> Self {
		let close = app.buttons[TestIdentifiers.CarletonMap.close].firstMatch
		XCTAssertTrue(
			close.waitForExistence(timeout: 30),
			"Selecting a building should show its card, which offers a way out")
		return self
	}
}
