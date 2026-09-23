import XCTest

struct StudentWorkScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.studentWork)
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
	func checkJobsSiteLinkIsExternal() -> Self {
		XCTAssertTrue(
			jobsSiteLink.images[TestIdentifiers.StudentWork.externalLinkAccessory].exists,
			"The jobs-site link should carry the up-right arrow of a link that leaves the app")
		return self
	}

	/// A slow drag across the fields, so it scrolls them by about its own
	/// length rather than flinging.
	@discardableResult
	func dragJobPostingFieldsUp() -> Self {
		let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
		let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.5)
		return self
	}

	@discardableResult
	func checkJobsSiteLinkReachable() -> Self {
		XCTAssertLessThan(
			jobsSiteLink.frame.maxY, app.frame.height,
			"Scrolling the fields should bring the jobs-site link fully on screen")
		XCTAssertTrue(jobsSiteLink.isHittable, "The jobs-site link should be tappable")
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
		app.buttonLabelled(TestIdentifiers.StudentWork.jobsSiteLink)
	}
}
