import XCTest

class ModuleStudentWorkTests: UITestCaseUnbooted {
	private typealias IDs = TestIdentifiers.StudentWork

	/// A row drops its title's term and pay code and shows the wage the code
	/// stands for. The posting's own screen titles it the same way, and turns
	/// what the prefix and code said into rows.
	func testCodedPostingShowsItsDisplayTitleWageLevelAndTerm() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openAllPostings()
			.verifyPostingDetail(IDs.fixtureCodedJob, contains: IDs.fixtureCodedJobWage)
			.capture("Student Work list")
			.openJobPosting(IDs.fixtureCodedJob)
			.capture("Job posting with a display title")
			.verifyDetailRow(IDs.wageRow, IDs.fixtureCodedJobWage)
			.verifyDetailRow(IDs.levelRow, IDs.entryLevel)
			.verifyDetailRow(IDs.termRow, IDs.academicYear)
	}

	func testTheLayoutMenuSwitchesTheAreasToRows() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyAreaTileCount(IDs.areaCount)
			.chooseLayout(TestIdentifiers.Layout.list)
			.verifyAreaRowsShown()
			.capture("Student Work area rows")
	}

	func testPostingsAreSectionedByHowRecentlyTheyWentUp() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openAllPostings()
			.verifySection(IDs.thisWeek)
			.verifySection(IDs.lastWeek)
			.verifySection(IDs.earlier)
	}

	func testLandingShowsSixteenAreas() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyAreaTileCount(IDs.areaCount)
			.capture("Student Work landing")
	}

	/// An empty area's tile is dimmed, not disabled: it opens, to a list that
	/// says there is nothing in it.
	func testEmptyAreaOpensToAListThatSaysSo() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openArea(IDs.emptyArea)
			.verifyTrigger(IDs.areaFilter, isSelected: true)
			.verifyNoMatchingJobs()
	}

	func testAreaTileOpensTheListFilteredToThatArea() throws {
		StudentWorkScreen(app: app)
			.navigate()
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
