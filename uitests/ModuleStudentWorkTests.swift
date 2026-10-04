import XCTest

class ModuleStudentWorkTests: UITestCaseUnbooted {
	private typealias IDs = TestIdentifiers.StudentWork

	func testTheLayoutMenuSwitchesTheAreasToRows() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyAreaTileCount(IDs.areaCount)
			.chooseLayout(TestIdentifiers.Layout.list)
			.verifyAreaRowsShown()
			.capture("Student Work area rows")
	}

	/// An area's tile opens the postings filtered to that area. An empty
	/// area's tile is dimmed, not disabled: it opens, to a list that says
	/// there is nothing in it.
	func testAreaTilesOpenTheListFilteredToTheirArea() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openArea(IDs.emptyArea)
			.verifyTrigger(IDs.areaFilter, isSelected: true)
			.verifyNoMatchingJobs()
			.goBack()
			.openArea(IDs.researchArea)
			.verifyTrigger(IDs.areaFilter, isSelected: true)
			.verifyPostingListed(IDs.fixtureJobWithWrappingField)
			.verifyPostingHidden(IDs.fixtureJobWithShortFields)
	}

	func testJobDescriptionOpensOnItsOwnScreen() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openAllPostings()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.openJobDescription()
			.capture("Job description screen")
			.checkJobDescriptionShown()
	}
}
