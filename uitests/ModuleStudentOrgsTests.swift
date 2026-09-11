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
}
