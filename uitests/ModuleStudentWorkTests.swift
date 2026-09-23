import XCTest

class ModuleStudentWorkTests: UITestCase {
	private typealias IDs = TestIdentifiers.StudentWork

	/// The title drops its term and pay code, and the row shows the wage the
	/// code stands for.
	func testRowShowsTheWageForItsPayCode() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingDetail(IDs.fixtureCodedJob, contains: IDs.fixtureCodedJobWage)
			.capture("Student Work list")
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
			.search(for: "fixture")
			.verifyListStartsAtTheTop()
	}

	func testSearchNarrowsTheList() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.verifyPostingListed(IDs.fixtureJobWithShortFields)
			.search(for: "stav")
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
