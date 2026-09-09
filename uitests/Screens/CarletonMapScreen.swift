import XCTest

struct CarletonMapScreen: Screen {
	let app: XCUIApplication

	/// The picker sheet's search field, which is the sheet's only content at
	/// the collapsed detent it opens at.
	private var searchField: XCUIElement {
		app.textFields[TestIdentifiers.CarletonMap.search].firstMatch
	}

	/// The map has no home tile of its own -- both campuses' Campus screens
	/// carry the map button now, so getting to `/Map` means opening one of
	/// those screens first and tapping its top-right button. Defaults to
	/// Carleton's tile; pass `TestIdentifiers.Buttons.campus` for St. Olaf's.
	@discardableResult
	func navigate(from campusTile: String = TestIdentifiers.Buttons.carletonCampus) -> Self {
		navigateFromHome(to: campusTile)

		let mapButton = app.buttons[TestIdentifiers.Campus.mapButton].firstMatch
		XCTAssertTrue(
			mapButton.waitForExistence(timeout: 30),
			"\(campusTile)'s Campus screen should offer a map button")

		// Retried for the reason navigateFromHome retries: a synthesized press
		// on a button whose host has mounted but whose action still has to
		// reach JavaScript lands natively and does nothing.
		for attempt in 1...3 {
			mapButton.tap()
			if searchField.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(attempt) on the map button did not open the map; retrying"
			) { _ in }
		}

		XCTFail("Tapping the map button never opened the map")
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
	/// Matched on the label's prefix, not the whole label: a building carrying
	/// an abbreviation reads as "Buntrock Commons, BC", so an exact match finds
	/// St. Olaf's rows only by accident of them not having one.
	@discardableResult
	func selectBuilding(named name: String) -> Self {
		let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"The expanded sheet should list \(name)")

		let close = app.buttons[TestIdentifiers.CarletonMap.close].firstMatch
		for attempt in 1...3 {
			// The row's centre on purpose. It falls on the Spacer between the
			// name and the chevron, which is outside what a SwiftUI button's
			// label draws -- the row carries a contentShape so the whole of it
			// responds, and tapping over the name would pass either way.
			row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
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
