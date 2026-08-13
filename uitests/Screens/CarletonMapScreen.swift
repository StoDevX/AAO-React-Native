import XCTest

struct CarletonMapScreen: Screen {
	let app: XCUIApplication

	/// The picker sheet's search field, which is the sheet's only content at
	/// the collapsed detent it opens at.
	private var searchField: XCUIElement {
		app.textFields[TestIdentifiers.CarletonMap.search].firstMatch
	}

	@discardableResult
	func navigate() -> Self {
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
	@discardableResult
	func selectBuilding(named name: String) -> Self {
		let row = app.buttons[name].firstMatch
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"The expanded sheet should list \(name)")
		row.tap()
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
