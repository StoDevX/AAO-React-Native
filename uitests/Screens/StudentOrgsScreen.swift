import XCTest

struct StudentOrgsScreen: Screen {
	let app: XCUIApplication

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.studentOrgs)
	}

	@discardableResult
	func verifyStudentOrgsTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.studentOrgs)
	}

	/// Search across every category. The landing screen shows category tiles
	/// until a query is typed, so this is also how a test reaches an org row
	/// unambiguously -- a category can share an org's name (e.g. "Academic"),
	/// but only the search results render `DisclosureRow`s rather than tiles.
	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Student Orgs should offer a search field")
		searchField.tap()
		searchField.typeText(text)

		// The field is the one place the typed text is held, so read it back
		// before going on: a test that searched nothing would pass no matter
		// what it typed.
		XCTAssertEqual(
			searchField.value as? String, text,
			"Typing should put the query in the search field")
		return self
	}

	@discardableResult
	func verifyCategoryTilesShown() -> Self {
		let grid = app.element(matching: TestIdentifiers.StudentOrgs.categoryGrid)
		XCTAssertTrue(
			grid.waitForExistence(timeout: 30),
			"The category grid should be visible before a search")
		XCTAssertGreaterThan(
			grid.buttons.count, 0,
			"The category grid should hold at least one category tile")
		return self
	}

	/// Taps whichever category tile is first in the grid and returns its label,
	/// so the caller can assert the next screen is titled for it without this
	/// test naming a category that Presence.io could rename or remove.
	func openFirstCategory() -> String {
		let grid = app.element(matching: TestIdentifiers.StudentOrgs.categoryGrid)
		XCTAssertTrue(
			grid.waitForExistence(timeout: 30),
			"The category grid should be visible before a search")

		let tile = grid.buttons.firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"The category grid should hold at least one tile")

		let label = tile.label
		tile.tap()
		return label
	}
}
