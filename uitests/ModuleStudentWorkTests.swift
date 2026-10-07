import XCTest

class ModuleStudentWorkTests: UITestCaseUnbooted {
	private typealias IDs = TestIdentifiers.StudentWork

	func testJobDescriptionOpensOnItsOwnScreen() throws {
		StudentWorkScreen(app: app)
			.navigate()
			.openAllPostings()
			.openJobPosting(TestIdentifiers.StudentWork.fixtureJobWithWrappingField)
			.openJobDescription()
			.checkJobDescriptionShown()
	}
}
