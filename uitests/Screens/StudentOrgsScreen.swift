import XCTest

struct StudentOrgsScreen: Screen {
	let app: XCUIApplication

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[TestIdentifiers.StudentOrgs.title]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/student-orgs", mountedWhen: mounted)
	}

	/// Search across every category. The landing screen shows categories until
	/// a query is typed, so this is also how a test reaches an org row
	/// unambiguously -- a category can share an org's name (e.g. "Academic"),
	/// but only the search results list orgs.
	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitUntilExists(timeout: 30),
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

	/// Types more onto the query already in the field, so the results list
	/// stays mounted and only its rows change. Clearing the field instead would
	/// swap the list out for the category tiles.
	@discardableResult
	func refineSearch(appending text: String) -> Self {
		let before = (searchField.value as? String) ?? ""
		searchField.tap()
		searchField.typeText(text)
		XCTAssertEqual(
			searchField.value as? String, before + text,
			"Typing should add to the query already in the search field")
		return self
	}

	/// Scrolls the search results a few screens down, and asserts they moved.
	@discardableResult
	func scrollResultsDown() -> Self {
		XCTAssertTrue(resultsList.waitUntilExists(timeout: 30), "No search results appeared")
		let firstRowBefore = resultsList.buttons.firstMatch.label
		// A deliberate drag rather than `swipeUp()`: the results mount while the
		// keyboard is animating back in, and in that window the quick flicks
		// `swipeUp()` sends have been seen to leave the list where it was.
		let start = resultsList.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
		let end = resultsList.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.15))
		for _ in 0..<3 {
			start.press(forDuration: 0.1, thenDragTo: end)
		}
		XCTAssertNotEqual(
			resultsList.buttons.firstMatch.label, firstRowBefore,
			"Swiping up should scroll the search results")
		return self
	}

	/// Asserts the refined results begin at their first row, `first`: it is
	/// on screen, and pulling the list down reveals nothing above it. A list
	/// that kept its old scroll offset when the query changed leaves it above
	/// the top of the screen.
	@discardableResult
	func verifyResultsStartAtTheTop(with first: String) -> Self {
		let firstRow = resultsList.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", first)).firstMatch
		XCTAssertTrue(
			firstRow.waitForHittable(timeout: 10),
			"The refined results should start with \(first), on screen, not wherever the list was scrolled before")
		resultsList.swipeDown()
		XCTAssertTrue(
			resultsList.buttons.firstMatch.label.hasPrefix(first),
			"Nothing should sit above \(first) in the refined results")
		return self
	}

	private var resultsList: XCUIElement {
		app.element(matching: TestIdentifiers.StudentOrgs.resultsList)
	}
}
