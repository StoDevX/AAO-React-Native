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
		XCTAssertTrue(resultsList.waitForExistence(timeout: 30), "No search results appeared")
		let firstRowBefore = resultsList.buttons.firstMatch.label
		// A deliberate drag rather than `swipeUp()`: the results mount while the
		// keyboard is animating back in, and the quick flicks `swipeUp()` sends
		// then land without scrolling anything.
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

	/// Asserts the results begin at their first row: pulling the list down
	/// reveals nothing above the row already first. A list that kept its old
	/// scroll offset when the query changed leaves earlier results above the
	/// top of the screen. The org list is live data, so this cannot name the
	/// row that should be first.
	@discardableResult
	func verifyResultsStartAtTheTop() -> Self {
		// The query applies after a 200ms debounce. Wait for the rows to change
		// so the reading below is of the new results; a list that wrongly kept
		// its place may leave the same row first, so a timeout is not a failure.
		let firstRow = resultsList.buttons.firstMatch
		let stale = firstRow.label
		_ = XCTWaiter.wait(
			for: [
				XCTNSPredicateExpectation(
					predicate: NSPredicate(format: "label != %@", stale), object: firstRow)
			],
			timeout: 5)

		let top = resultsList.buttons.firstMatch.label
		capture("Student Orgs refined search results")
		resultsList.swipeDown()
		XCTAssertEqual(
			resultsList.buttons.firstMatch.label, top,
			"The refined results should start at their first row, not wherever the list was scrolled before")
		return self
	}

	private var resultsList: XCUIElement {
		app.collectionViews[TestIdentifiers.StudentOrgs.resultsList]
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
