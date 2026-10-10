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
		// Wiki Monkeys has few enough areas that the last preset is built
		// without a scroll, under the bottom search bar, which then takes the
		// tap. The list's end clears the bar.
		app.swipeUp()
		app.swipeUp()
		XCTAssertTrue(preset.waitUntilExists(timeout: 10), "The landing should offer \(title)")
		return tap(preset, until: postingsTitle, named: "the \(title) preset")
	}

	@discardableResult
	func openAllPostings() -> Self {
		openPreset(TestIdentifiers.StudentWork.allPostingsPreset)
	}

	/// Check the areas are drawn as rows, with the tiles gone.
	@discardableResult
	func verifyAreaRowsShown() -> Self {
		XCTAssertTrue(firstAreaRow.waitUntilExists(timeout: 30), "The areas should be drawn as rows")
		XCTAssertTrue(areaGrid.waitUntilGone(timeout: 10), "The area tiles should be gone")
		return self
	}

	/// Check the areas are drawn as tiles, with the rows gone.
	@discardableResult
	func verifyAreaTilesShown() -> Self {
		XCTAssertTrue(areaGrid.waitUntilExists(timeout: 30), "The areas should be drawn as tiles")
		XCTAssertTrue(firstAreaRow.waitUntilGone(timeout: 10), "The area rows should be gone")
		return self
	}

	private var firstAreaRow: XCUIElement {
		app.buttons
			.matching(NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.StudentWork.areaRowPrefix))
			.firstMatch
	}

	private var areaGrid: XCUIElement {
		app.element(matching: TestIdentifiers.StudentWork.areaGrid)
	}

	/// The postings list's title, which only that screen draws.
	private var postingsTitle: XCUIElement {
		app.navigationBars[TestIdentifiers.StudentWork.postingsTitle]
	}

	/// A posting's row, found by the title it leads with.
	private func row(_ title: String) -> XCUIElement {
		app.elementWithLabel(startingWith: title)
	}

	/// Opens a fixture posting by its title, which leads its row's label.
	@discardableResult
	func openJobPosting(_ title: String) -> Self {
		// Marked by the posting's own title, not a row in it: a form builds rows
		// only as they near the screen, so its last rows may not exist yet.
		tap(app.elementWithLabel(startingWith: title), until: app.navigationBars[title], named: "\(title)'s row")
	}

	@discardableResult
	func openJobDescription() -> Self {
		let row = app.buttonLabelled(TestIdentifiers.StudentWork.jobDescriptionRow)
		// Scrolled to until tappable: a form builds a row only once it nears
		// the screen, and may build it before it is on screen.
		for _ in 0..<6 {
			if row.isHittable {
				break
			}
			app.swipeUp()
		}
		return tap(
			row, until: app.navigationBars[TestIdentifiers.StudentWork.jobDescriptionRow],
			named: "the Description row")
	}

	@discardableResult
	func checkJobDescriptionShown() -> Self {
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.StudentWork.fixtureJobDescriptionParagraph)
				.waitUntilExists(timeout: 10),
			"The description screen should hold the posting's text")
		return self
	}
}
