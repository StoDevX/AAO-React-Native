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

	/// Open the entry named `name` and follow the department it belongs to,
	/// landing on a Directory screen the route seeded with that department.
	@discardableResult
	func openDepartment(of name: String, named department: String) -> Self {
		let entry = app.elementWithLabel(startingWith: name)
		XCTAssertTrue(
			entry.waitForExistence(timeout: 30),
			"\(name) should be among the results")
		entry.tap()

		let departmentCell = app.elementWithLabel(startingWith: department)
		XCTAssertTrue(
			departmentCell.waitForExistence(timeout: 30),
			"\(name) should list \(department) as its department")
		departmentCell.tap()
		return self
	}

	/// Dismiss the search bar the way its own cancel button does.
	///
	/// The tap is retried, and each attempt tries a coordinate as well as the
	/// element. A pushed screen leaves full-width containers above the toolbar
	/// in the tree, so XCUITest finds no hit point for the field and reports
	/// it unhittable even while a finger reaches it perfectly well.
	@discardableResult
	func cancelSearch() -> Self {
		let field = searchField
		XCTAssertTrue(
			field.waitForExistence(timeout: 30),
			"Directory should offer a search field")

		let cancel = app.buttonLabelled(TestIdentifiers.Search.cancelButton)
		for _ in 1...3 {
			field.tap()
			if cancel.waitForExistence(timeout: 5) { break }
			field.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
			if cancel.waitForExistence(timeout: 5) { break }
		}

		XCTAssertTrue(
			cancel.exists,
			"Tapping the search field should reveal its cancel button")
		cancel.tap()
		return self
	}

	/// Assert the department the screen was opened for is named above the list.
	///
	/// The screen's title reads "Directory" whatever it is showing, so a static
	/// text carrying the department name can only be the section heading.
	@discardableResult
	func verifyDepartmentHeading(_ department: String) -> Self {
		let heading = app.staticTexts[department].firstMatch
		XCTAssertTrue(
			heading.waitForExistence(timeout: 30),
			"\(department) should be named above the results")
		return self
	}

	/// Switch the results to the row list. The toggle only exists once a search
	/// has results, so this is called after one.
	@discardableResult
	func showAsList() -> Self {
		let toggle = app.buttonLabelled(TestIdentifiers.Directory.showAsList)
		XCTAssertTrue(
			toggle.waitForExistence(timeout: 30),
			"The results should offer a list/tiles toggle")
		toggle.tap()
		return self
	}

	/// Switch the results to the tile gallery.
	@discardableResult
	func showAsTiles() -> Self {
		let toggle = app.buttonLabelled(TestIdentifiers.Directory.showAsTiles)
		XCTAssertTrue(
			toggle.waitForExistence(timeout: 30),
			"The results should offer a list/tiles toggle")
		toggle.tap()
		return self
	}

	/// Assert the results have something in them, in whichever view is showing,
	/// without naming any of them: which people a department holds is the
	/// college's business, not this test's.
	@discardableResult
	func verifyResultsShown() -> Self {
		let firstRow = app.element(matching: "\(TestIdentifiers.Directory.rowPrefix)0")
		let firstTile = app.element(matching: "\(TestIdentifiers.Directory.tilePrefix)0")
		let deadline = Date().addingTimeInterval(30)
		while Date() < deadline && !firstRow.exists && !firstTile.exists {
			usleep(200_000)
		}
		XCTAssertTrue(
			firstRow.exists || firstTile.exists,
			"The directory results should have something in them")
		return self
	}

	/// Assert the results are showing as the row list.
	@discardableResult
	func verifyResultsListed() -> Self {
		let firstRow = app.element(matching: "\(TestIdentifiers.Directory.rowPrefix)0")
		XCTAssertTrue(
			firstRow.waitForExistence(timeout: 30),
			"The directory list should have results in it")
		return self
	}

	/// Assert the results are showing as the tile gallery.
	@discardableResult
	func verifyResultsGalleried() -> Self {
		let firstTile = app.element(matching: "\(TestIdentifiers.Directory.tilePrefix)0")
		XCTAssertTrue(
			firstTile.waitForExistence(timeout: 30),
			"The directory gallery should have tiles in it")
		return self
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

	/// Assert the contact's own action button is on screen. It appears only on
	/// the detail screen -- the grid tile just navigates -- so finding it here
	/// is proof navigation actually happened, unlike the contact's name, which
	/// SwiftUI collapses onto the grid's own tile button too, so asserting on
	/// that would pass without navigating anywhere.
	@discardableResult
	func verifyDetailAction(_ action: String) -> Self {
		let button = app.buttons[action].firstMatch
		XCTAssertTrue(
			button.waitForExistence(timeout: 30),
			"\(action) should be on the contact's detail screen")
		return self
	}
}
