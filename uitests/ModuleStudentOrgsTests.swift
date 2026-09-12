import XCTest

class ModuleStudentOrgsTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.verifyStudentOrgsTitle()
	}

	/// The landing screen is category tiles, not a flat list -- this is the
	/// whole point of the feature, so it is worth asserting on its own
	/// before any test that taps into one.
	func testShowsCategoryTilesBeforeASearch() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.verifyCategoryTilesShown()
			.capture("Student Orgs category grid")
	}

	/// Tapping a tile has to land on a screen scoped to that category, not
	/// the flat list -- the title naming the tapped category is the proof,
	/// since which orgs happen to be in it is Presence.io's business, not
	/// this test's.
	func testTappingACategoryOpensItsOwnScreen() throws {
		let screen = StudentOrgsScreen(app: app).navigate()
		let category = screen.openFirstCategory()

		screen.verifyTitle(category)
	}

	/// The landing search bar searches every org, so it has to be able to
	/// find something outside whatever category a reader happened to look
	/// at last -- this only proves results can appear at all, not which
	/// ones, since the org list is live data.
	func testLandingSearchCanReturnResults() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.search(for: "a")
			.capture("Student Orgs search results")
	}

	func testStudentOrgDetail() throws {
		// Searching first, rather than tapping straight from the landing
		// screen, is what disambiguates: the landing screen shows category
		// tiles before any query is typed, and "Academic" now names a real
		// curated category as well as an org, so a bare label match there
		// could resolve to the tile instead of a row. Only the search
		// results render org rows.
		let screen = StudentOrgsScreen(app: app).navigate().search(for: "academic")

		let firstOrg = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "Academic"))
			.firstMatch
		XCTAssertTrue(firstOrg.waitForExistence(timeout: 30), "An org should be listed")
		firstOrg.tap()

		// Wait for a section of the pushed screen, not just the tap: a capture
		// taken straight after lands mid-animation, with both screens on it.
		let category = app.staticTexts["CATEGORY"].firstMatch
		XCTAssertTrue(category.waitForExistence(timeout: 30), "The org detail should be shown")

		screen.capture("Student Orgs - detail")
	}
}
