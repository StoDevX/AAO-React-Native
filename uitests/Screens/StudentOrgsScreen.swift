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
}
