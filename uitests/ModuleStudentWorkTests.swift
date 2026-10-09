import XCTest

/// Tags: campus:example.college
class ModuleStudentWorkTests: UITestCaseUnbooted {
	private typealias IDs = TestIdentifiers.StudentWork

	/// The layout menu draws the areas as rows and back as tiles, the one
	/// UITest of the menu Student Orgs shares. A posting's Description row
	/// then opens the description on a screen of its own.
	func testJobDescriptionOpensOnItsOwnScreen() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.chooseLayout(TestIdentifiers.Layout.list)
			.verifyAreaRowsShown()
			.chooseLayout(TestIdentifiers.Layout.grid)
			.verifyAreaTilesShown()
			.openAllPostings()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.openJobDescription()
			.checkJobDescriptionShown()
	}
}
