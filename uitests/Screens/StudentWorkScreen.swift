import XCTest

struct StudentWorkScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		areaGrid
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/student-work", mountedWhen: mounted)
	}

	/// Opens a preset below the tiles, whose row label leads with its title.
	@discardableResult
	func openPreset(_ title: String) -> Self {
		let preset = app.elementWithLabel(startingWith: title)
		XCTAssertTrue(areaGrid.waitForExistence(timeout: 30), "The landing should load")
		// Below the tiles, and the list builds rows only as they near the screen.
		scrollUntilExists(preset)
		XCTAssertTrue(preset.waitForExistence(timeout: 10), "The landing should offer \(title)")
		preset.tap()
		return waitForPostings()
	}

	@discardableResult
	func openAllPostings() -> Self {
		openPreset(TestIdentifiers.StudentWork.allPostingsPreset)
	}

	/// Opens an area's tile, whose label leads with the area's name.
	@discardableResult
	func openArea(_ name: String) -> Self {
		let tile = areaGrid.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
		XCTAssertTrue(tile.waitForExistence(timeout: 30), "The landing should have a \(name) tile")
		tile.tap()
		return waitForPostings()
	}

	@discardableResult
	func verifyAreaTileCount(_ count: Int) -> Self {
		XCTAssertTrue(areaGrid.waitForExistence(timeout: 30), "The landing should show its area tiles")
		XCTAssertEqual(areaGrid.buttons.count, count, "The landing should have \(count) area tiles")
		return self
	}

	/// The list says it has nothing, rather than showing an empty screen.
	@discardableResult
	func verifyNoMatchingJobs() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.StudentWork.noMatchingJobs].waitForExistence(timeout: 30),
			"The list should say no jobs match")
		return self
	}

	@discardableResult
	func verifyTrigger(_ key: String, isSelected expected: Bool) -> Self {
		FilterScreen(app: app).verifyTrigger(key, isSelected: expected)
		return self
	}

	private var areaGrid: XCUIElement {
		app.element(matching: TestIdentifiers.StudentWork.areaGrid)
	}

	private func waitForPostings() -> Self {
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.StudentWork.postingsTitle].waitForExistence(timeout: 30),
			"The postings should open")
		return self
	}

	/// A posting's row, found by the title it leads with.
	private func row(_ title: String) -> XCUIElement {
		app.elementWithLabel(startingWith: title)
	}

	@discardableResult
	func verifyPostingListed(_ title: String) -> Self {
		XCTAssertTrue(row(title).waitForExistence(timeout: 30), "Student Work should list \(title)")
		return self
	}

	@discardableResult
	func verifyPostingHidden(_ title: String) -> Self {
		XCTAssertTrue(row(title).waitForNonExistence(timeout: 10), "Student Work should hide \(title)")
		return self
	}

	/// The row's label carries its detail line after the title.
	@discardableResult
	func verifyPostingDetail(_ title: String, contains detail: String) -> Self {
		let listed = row(title)
		XCTAssertTrue(listed.waitForExistence(timeout: 30), "Student Work should list \(title)")
		XCTAssertTrue(
			listed.label.contains(detail),
			"\(title)'s row should read \(detail), but its label is \(listed.label)")
		return self
	}

	/// Chooses one option in a filter's pull-down menu, then closes it.
	@discardableResult
	func choose(_ option: String, inFilter key: String) -> Self {
		let filters = FilterScreen(app: app)
		filters
			.openFilter(key, until: filters.menuItem(option))
			.tapMenuItem(option)
			.dismissMenu(waitingFor: option)
		return self
	}

	private var postingsList: XCUIElement {
		app.collectionViews[TestIdentifiers.StudentWork.postingsList]
	}

	/// Asserts a posting's row carries the New dot, whose label leads the
	/// row's own.
	@discardableResult
	func verifyPostingIsNew(_ title: String) -> Self {
		let row = app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.newPrefix + title)
		XCTAssertTrue(row.waitForExistence(timeout: 30), "\(title) should be marked new")
		return self
	}

	/// Asserts a posting's row is listed without the New dot.
	@discardableResult
	func verifyPostingIsNotNew(_ title: String) -> Self {
		verifyPostingListed(title)
		XCTAssertFalse(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.newPrefix + title).exists,
			"\(title) should not be marked new")
		return self
	}

	/// Asserts no row on screen carries the New dot.
	@discardableResult
	func verifyNothingIsNew() -> Self {
		XCTAssertTrue(postingsList.waitForExistence(timeout: 30), "The postings should appear")
		XCTAssertFalse(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.newPrefix).exists,
			"No posting should be marked new on a first visit")
		return self
	}

	/// Asserts the list has a section with this title, scrolling to reach it:
	/// the list builds its rows only as they near the screen.
	@discardableResult
	func verifySection(_ title: String) -> Self {
		let header = postingsList.staticTexts[title]
		scrollUntilExists(header, in: postingsList)
		XCTAssertTrue(header.exists, "The postings should have a \(title) section")
		return self
	}

	/// Leaves the postings for Student Work's landing.
	@discardableResult
	func navigateBackToLanding() -> Self {
		let backButton = app.navigationBars[TestIdentifiers.StudentWork.postingsTitle]
			.buttons[TestIdentifiers.Navigation.systemBackButton]
		XCTAssertTrue(backButton.waitForExistence(timeout: 10), "The postings should offer a way back")
		backButton.tap()
		XCTAssertTrue(areaGrid.waitForExistence(timeout: 30), "Going back should land on the tiles")
		return self
	}

	/// Leaves Student Work for the home screen, which is when it remembers
	/// what the student has seen.
	@discardableResult
	func navigateBack() -> Self {
		// Scoped to this screen's bar: every back button reads the same, and
		// iOS 27 can keep more than one navigation bar in the tree.
		let backButton = app.navigationBars[TestIdentifiers.Buttons.studentWork]
			.buttons[TestIdentifiers.Navigation.systemBackButton]
		XCTAssertTrue(backButton.waitForExistence(timeout: 10), "Student Work should offer a way back")
		backButton.tap()
		XCTAssertTrue(
			app.element(matching: TestIdentifiers.Home.screen).waitForExistence(timeout: 30),
			"Leaving Student Work should land on the home screen")
		return self
	}

	/// Asserts an open posting shows this Details row. A `LabeledContent` row
	/// reads as one element, its label and value joined by a comma.
	@discardableResult
	func verifyDetailRow(_ label: String, _ value: String) -> Self {
		XCTAssertTrue(
			app.staticTexts["\(label), \(value)"].firstMatch.waitForExistence(timeout: 10),
			"The posting should show a \(label) row reading \(value)")
		return self
	}

	@discardableResult
	func search(for text: String) -> Self {
		let field = app.searchFields.firstMatch
		XCTAssertTrue(field.waitForExistence(timeout: 30), "Student Work should offer a search field")
		field.tap()
		field.typeText(text)
		// A test that searched nothing would pass no matter what the list did.
		XCTAssertEqual(
			field.value as? String, text, "Typing should put the query in the search field")
		return self
	}

	/// Opens a fixture posting by its title, which leads its row's label.
	@discardableResult
	func openJobPosting(_ title: String) -> Self {
		let job = app.elementWithLabel(startingWith: title)
		XCTAssertTrue(job.waitForExistence(timeout: 30), "Student Work should list \(title)")
		job.tap()
		// The posting's own title, not a row in it: a form builds rows only as
		// they near the screen, so its last rows may not exist yet.
		XCTAssertTrue(
			app.navigationBars[title].waitForExistence(timeout: 30),
			"Tapping \(title) should open its posting")
		return self
	}

	@discardableResult
	func openJobDescription() -> Self {
		let row = app.buttonLabelled(TestIdentifiers.StudentWork.jobDescriptionRow)
		// Scrolled to until tappable, not merely present: a form builds rows
		// before they are on screen.
		for _ in 0..<6 where !row.isHittable {
			app.swipeUp()
		}
		XCTAssertTrue(row.isHittable, "The posting should offer its description as a row")
		row.tap()
		return self
	}

	@discardableResult
	func checkJobDescriptionShown() -> Self {
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.StudentWork.jobDescriptionRow].waitForExistence(timeout: 10),
			"The description should open on a screen of its own")
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.fixtureJobDescriptionParagraph)
				.waitForExistence(timeout: 10),
			"The description screen should hold the posting's text")
		return self
	}

	private var jobsSiteLink: XCUIElement {
		app.linkLabelled(TestIdentifiers.StudentWork.jobsSiteLink)
	}
}
