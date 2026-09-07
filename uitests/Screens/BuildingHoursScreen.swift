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
}
