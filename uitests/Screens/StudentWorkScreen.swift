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
		XCTAssertTrue(areaGrid.waitUntilExists(timeout: 30), "The landing should load")
		// Below the tiles, and the list builds rows only as they near the screen.
		scrollUntilExists(preset)
		XCTAssertTrue(preset.waitUntilExists(timeout: 10), "The landing should offer \(title)")
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
		XCTAssertTrue(tile.waitUntilExists(timeout: 30), "The landing should have a \(name) tile")
		tile.tap()
		return waitForPostings()
	}

	@discardableResult
	func verifyAreaTileCount(_ count: Int) -> Self {
		XCTAssertTrue(areaGrid.waitUntilExists(timeout: 30), "The landing should show its area tiles")
		XCTAssertEqual(areaGrid.buttons.count, count, "The landing should have \(count) area tiles")
		return self
	}

	@discardableResult
	func verifyAreaRowsShown() -> Self {
		let row = app.buttons
			.matching(NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.StudentWork.areaRowPrefix))
			.firstMatch
		XCTAssertTrue(row.waitUntilExists(timeout: 30), "The areas should be drawn as rows")
		XCTAssertFalse(areaGrid.exists, "The area tiles should be gone")
		return self
	}

	/// The list says it has nothing, rather than showing an empty screen.
	@discardableResult
	func verifyNoMatchingJobs() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.StudentWork.noMatchingJobs].waitUntilExists(timeout: 30),
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
			app.navigationBars[TestIdentifiers.StudentWork.postingsTitle].waitUntilExists(timeout: 30),
			"The postings should open")
		return self
	}

	/// A posting's row, found by the title it leads with.
	private func row(_ title: String) -> XCUIElement {
		app.elementWithLabel(startingWith: title)
	}

	@discardableResult
	func verifyPostingListed(_ title: String) -> Self {
		XCTAssertTrue(row(title).waitUntilExists(timeout: 30), "Student Work should list \(title)")
		return self
	}

	@discardableResult
	func verifyPostingHidden(_ title: String) -> Self {
		XCTAssertTrue(row(title).waitUntilGone(timeout: 10), "Student Work should hide \(title)")
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

	@discardableResult
	func search(for text: String) -> Self {
		let field = app.searchFields.firstMatch
		XCTAssertTrue(field.waitUntilExists(timeout: 30), "Student Work should offer a search field")
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
		XCTAssertTrue(job.waitUntilExists(timeout: 30), "Student Work should list \(title)")
		job.tap()
		// The posting's own title, not a row in it: a form builds rows only as
		// they near the screen, so its last rows may not exist yet.
		XCTAssertTrue(
			app.navigationBars[title].waitUntilExists(timeout: 30),
			"Tapping \(title) should open its posting")
		return self
	}

	@discardableResult
	func openJobDescription() -> Self {
		let row = app.buttonLabelled(TestIdentifiers.StudentWork.jobDescriptionRow)
		// Scrolled to until tappable, not merely present: a form builds rows
		// before they are on screen.
		for _ in 0..<6 {
			if row.isHittable {
				break
			}
			app.swipeUp()
		}
		XCTAssertTrue(row.isHittable, "The posting should offer its description as a row")
		row.tap()
		return self
	}

	@discardableResult
	func checkJobDescriptionShown() -> Self {
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.StudentWork.jobDescriptionRow].waitUntilExists(timeout: 10),
			"The description should open on a screen of its own")
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.fixtureJobDescriptionParagraph)
				.waitUntilExists(timeout: 10),
			"The description screen should hold the posting's text")
		return self
	}

	private var jobsSiteLink: XCUIElement {
		app.linkLabelled(TestIdentifiers.StudentWork.jobsSiteLink)
	}
}
