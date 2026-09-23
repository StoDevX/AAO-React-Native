import XCTest

class ModuleStudentWorkTests: UITestCase {
	private typealias IDs = TestIdentifiers.StudentWork

	/// A row drops its title's term and pay code and shows the wage the code
	/// stands for. The posting's own screen titles it the same way, and turns
	/// what the prefix and code said into rows.
	func testCodedPostingShowsItsDisplayTitleWageLevelAndTerm() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingDetail(IDs.fixtureCodedJob, contains: IDs.fixtureCodedJobWage)
			.capture("Student Work list")
			.openJobPosting(IDs.fixtureCodedJob)
			.capture("Job posting with a display title")
			.verifyDetailRow(IDs.wageRow, IDs.fixtureCodedJobWage)
			.verifyDetailRow(IDs.levelRow, IDs.entryLevel)
			.verifyDetailRow(IDs.termRow, IDs.academicYear)
	}

	func testPostingsAreSectionedByHowRecentlyTheyWentUp() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifySection(IDs.thisWeek)
			.verifySection(IDs.lastWeek)
			.verifySection(IDs.earlier)
	}

	/// A first visit marks nothing new; a posting that appears before the
	/// next visit is, and one already seen is not.
	func testPostingAddedSinceTheLastVisitIsMarkedNew() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyNothingIsNew()
			.navigateBack()

		relaunchKeepingState(adding: TestIdentifiers.LaunchArguments.extraJobPosting)

		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingIsNew(IDs.fixtureExtraJob)
			.capture("Student Work with a new posting")
			.verifyPostingIsNotNew(IDs.fixtureCodedJob)
	}

	func testLevelFilterNarrowsTheList() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingListed(IDs.fixtureJobWithShortFields)
			.choose(IDs.entryLevel, inFilter: IDs.levelFilter)
			.verifyPostingListed(IDs.fixtureCodedJob)
			.verifyPostingHidden(IDs.fixtureJobWithShortFields)
			.capture("Student Work filtered to entry-level")
	}

	func testChoosingAFilterFromFarDownTheListStartsAtTheTop() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.scrollListDown()
			.choose(IDs.experienced, inFilter: IDs.levelFilter)
			.verifyListStartsAtTheTop()
	}

	func testSearchingFromFarDownTheListStartsAtTheTop() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.scrollListDown()
			.search(for: IDs.fixtureFillerPrefix)
			.verifyListStartsAtTheTop()
	}

	func testSearchNarrowsTheList() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingListed(IDs.fixtureJobWithShortFields)
			.search(for: IDs.fixtureCodedJobSearch)
			.verifyPostingListed(IDs.fixtureCodedJob)
			.verifyPostingHidden(IDs.fixtureJobWithShortFields)
	}

	func testJobPostingLinksOutToTheJobsSite() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithShortFields)
			.checkJobsSiteLinkIsExternal()
	}

	/// The fields are one form that scrolls itself, so its last row can reach
	/// the screen. A form nested in another scroll view, sized to its content,
	/// comes out too short when a field wraps, and a drag then stops with the
	/// jobs-site link pinned at the bottom of the screen.
	func testJobPostingFieldsScrollToTheJobsSiteLink() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.dragJobPostingFieldsUp()
			.capture("Job posting fields scrolled to the end")
			.checkJobsSiteLinkReachable()
	}

	func testJobDescriptionOpensOnItsOwnScreen() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.openJobDescription()
			.capture("Job description screen")
			.checkJobDescriptionShown()
	}
}
