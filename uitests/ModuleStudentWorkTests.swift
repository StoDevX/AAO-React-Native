import XCTest

/// Tags: campus:example.college
class ModuleStudentWorkTests: UITestCaseUnbooted {
	private typealias IDs = TestIdentifiers.StudentWork

	/// The layout menu draws the areas as tiles and back as rows, the one
	/// UITest of the menu Student Orgs shares. A posting's Description row
	/// then opens the description on a screen of its own.
	func testJobDescriptionOpensOnItsOwnScreen() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.capture("Student Work landing")
			.chooseLayout(TestIdentifiers.Layout.grid)
			.verifyAreaTilesShown()
			.capture("Student Work landing, tiles")
			.chooseLayout(TestIdentifiers.Layout.list)
			.verifyAreaRowsShown()
			.openAllPostings()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.openJobDescription()
			.checkJobDescriptionShown()
	}
}
