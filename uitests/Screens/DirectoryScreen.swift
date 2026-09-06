import XCTest

struct DirectoryScreen: Screen {
	let app: XCUIApplication

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.directory)
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Directory should offer a search field")
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
	func verifySearchText(_ text: String) -> Self {
		let field = searchField
		let predicate = NSPredicate(format: "value == %@", text)
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: predicate, object: field)],
			timeout: 10)
		XCTAssertEqual(
			settled, .completed,
			"Search field should still read \(text), but reads "
				+ "\(field.value as? String ?? "nothing")")
		return self
	}

	@discardableResult
	func verifyDirectoryTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.directory)
	}

	@discardableResult
	func verifyContactsHeading() -> Self {
		verifyTitle(TestIdentifiers.Directory.importantContacts)
	}

	@discardableResult
	func verifyContactTiles(count: Int) -> Self {
		let grid = app.element(matching: TestIdentifiers.Directory.contactGrid)
		XCTAssertTrue(
			grid.waitForExistence(timeout: 30),
			"The contact grid should be visible before a search")
		XCTAssertEqual(
			grid.buttons.count, count,
			"The grid should hold \(count) contact tiles")
		return self
	}

	@discardableResult
	func openContact(_ title: String) -> Self {
		let tile = app.buttons[title].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(title) should have a tile in the grid")
		tile.tap()
		return self
	}

	/// A tile's long-press menu offers the contact's own action. The menu is
	/// presented by iOS, so nothing short of pressing it proves it is there.
	@discardableResult
	func verifyContactMenu(for title: String, offers action: String) -> Self {
		let tile = app.buttons[title].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(title) should have a tile in the grid")
		tile.press(forDuration: 1.0)

		let item = app.buttons[action].firstMatch
		XCTAssertTrue(
			item.waitForExistence(timeout: 10),
			"Long-pressing \(title) should offer \(action)")
		return self
	}
}
