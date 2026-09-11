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

		// An interactive pop tears the search field down and rebuilds it, so
		// for a moment after a cancelled swipe there is no SearchField to
		// query at all. Waiting for the element before asking about its value
		// keeps that window from reading as "the query was lost".
		XCTAssertTrue(
			field.waitForExistence(timeout: 10),
			"Search field should come back after a cancelled swipe back")

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

	/// Distinguishes a sheet from a full-screen push: a pushed screen replaces
	/// the grid in the hierarchy, while a sheet leaves it present underneath.
	///
	/// `XCUIElement.exists` is true for a merely-covered element as much as a
	/// visible one, so this does not tell a sheet apart from anything else
	/// that leaves the grid behind it -- only from the push it replaces, which
	/// is the whole of what is under test here.
	@discardableResult
	func verifyContactGridStillBehind() -> Self {
		let grid = app.element(matching: TestIdentifiers.Directory.contactGrid)
		XCTAssertTrue(
			grid.exists,
			"The contact grid should still be behind the sheet, not replaced by it")
		return self
	}

	/// Swipe the contact sheet away, with the same press-drag-hold shape
	/// `FilterScreen.dismissSheet` uses.
	///
	/// The drag starts on the sheet's own navigation bar rather than in its
	/// body: a drag begun inside the scrollable content scrolls that content
	/// instead of moving the sheet, and reports nothing either way.
	///
	/// That bar is found by `title` -- the contact's own name, which only the
	/// sheet carries, the screen behind it being titled "Directory". An
	/// index-picked bar is not a substitute: the presenting screen's own bar
	/// is above the sheet, behind the dimmed backdrop, and a drag from there
	/// dismisses the sheet by backdrop rather than by grabber -- a different
	/// gesture that ends in the same place, so the test would still pass.
	///
	/// `action` is the contact's own button, which exists only on the detail
	/// -- the contact's name will not do, since SwiftUI collapses that onto
	/// the grid's tile button too, and it never goes away.
	@discardableResult
	func dismissContactSheet(titled title: String, waitingFor action: String) -> Self {
		let bar = app.navigationBars[title]
		XCTAssertTrue(
			bar.waitForExistence(timeout: 30),
			"The \(title) sheet should have a navigation bar to drag from")

		bar.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
			.press(
				forDuration: 0.15,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.97)),
				withVelocity: .default,
				thenHoldForDuration: 0.1)

		XCTAssertTrue(
			app.buttons[action].firstMatch.waitForNonExistence(timeout: 30),
			"The contact sheet should be gone after a swipe down")
		return self
	}

	/// Taps a second contact's tile while the first's sheet is up.
	///
	/// Three things keep this from passing vacuously. The tap goes through a
	/// screen coordinate rather than `XCUIElement.tap()`, because the tile is
	/// expected not to respond -- a plain `.tap()` would fail for
	/// unhittability, which is a different claim than the one being made. The
	/// sheet's top edge comes from its own navigation bar, found by
	/// `sheetTitle` -- the contact's name, which only the sheet carries, the
	/// screen behind it being titled "Directory". An index-picked bar would be
	/// the presenting screen's, which sits above the sheet and would put the
	/// comparison against the wrong edge. And the tap aims at `dy: 0.1`, the
	/// tile's upper edge, rather than its centre: the first grid row's tile is
	/// tall enough that its centre sits below the sheet's top edge even while
	/// its top is exposed above it, so the centre is the wrong point to prove
	/// anything with.
	@discardableResult
	func attemptToTapContactBehindSheet(_ title: String, whileShowing sheetTitle: String) -> Self {
		let tile = app.buttons[title].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(title) should still have a tile behind the sheet")

		let sheetBar = app.navigationBars[sheetTitle]
		XCTAssertTrue(
			sheetBar.waitForExistence(timeout: 30),
			"The \(sheetTitle) sheet should have a navigation bar marking its top edge")

		let point = tile.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.1))
		XCTAssertLessThan(
			point.screenPoint.y, sheetBar.frame.minY,
			"\(title)'s tile sits under the sheet, so tapping it would land on the sheet "
				+ "itself and prove nothing -- this test needs a contact whose tile stays "
				+ "above the sheet's top edge")

		point.tap()
		return self
	}

	/// Assert the second contact's own action -- which appears nowhere but on
	/// its detail -- never showed up. That is the tell for a second sheet
	/// having stacked over the first.
	///
	/// Whether the tap also dismissed the sheet already up is not asserted
	/// here: tapping a dimmed backdrop to dismiss the sheet in front of it is
	/// ordinary sheet behaviour, and a different thing from the bug this
	/// guards against.
	@discardableResult
	func verifyNoSecondContactSheet(_ action: String) -> Self {
		XCTAssertFalse(
			app.buttons[action].firstMatch.waitForExistence(timeout: 5),
			"\(action) should never have appeared -- the tap should have been blocked by "
				+ "the dimmed grid behind the sheet, not reached through to stack a second one")
		return self
	}
}
