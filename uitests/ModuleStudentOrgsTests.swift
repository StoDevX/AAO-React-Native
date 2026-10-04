import XCTest

class ModuleStudentOrgsTests: UITestCaseUnbooted {
	/// The landing screen is a list of categories, not of every org -- this is
	/// the whole point of the feature, so it is asserted before anything taps
	/// into one.
	///
	/// Tapping a category has to land on a screen scoped to that category, not
	/// the flat list -- the title naming the tapped category is the proof,
	/// since which orgs happen to be in it is Presence.io's business, not
	/// this test's. Back on the landing, the layout menu draws the categories
	/// as tiles.
	func testTheLandingCategoriesOpenThemselvesAndBecomeTiles() throws {
		let screen = StudentOrgsScreen(app: app)
			.navigate()
			.verifyStudentOrgsTitle()
			.verifyCategoriesShown()
			.capture("Student Orgs categories")
		let category = screen.openFirstCategory()

		screen
			.verifyTitle(category)
			.goBack()
			.verifyCategoriesShown()
			.chooseLayout(TestIdentifiers.Layout.grid)
			.verifyCategoryGridShown()
			.capture("Student Orgs category grid")
	}

	/// The landing search bar searches every org, so it has to be able to
	/// find something outside whatever category a reader happened to look
	/// at last. Scrolling the results proves some appeared, not which ones,
	/// since the org list is live data. The first of the refined results then
	/// opens its org's detail.
	func testRefiningASearchFromFarDownTheResultsStartsAtTheTop() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.search(for: "a")
			.capture("Student Orgs search results")
			.scrollResultsDown()
			.refineSearch(appending: "n")
			.verifyResultsStartAtTheTop()
			.openFirstResult()
			.capture("Student Orgs - detail")
	}
}
