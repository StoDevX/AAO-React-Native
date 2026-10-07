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
			app.navigationBars[TestIdentifiers.StudentWork.jobDescriptionRow].waitForExistence(timeout: 10),
			"The description should open on a screen of its own")
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.fixtureJobDescriptionParagraph)
				.waitForExistence(timeout: 10),
			"The description screen should hold the posting's text")
		return self
	}

}
