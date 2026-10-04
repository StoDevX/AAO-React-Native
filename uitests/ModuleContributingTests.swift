import XCTest

class ModuleContributingTests: UITestCase {
	/// The ways to reach us come first, above the source code, and Report a
	/// Problem opens its form and closes back to Contributing. Then every
	/// section is there, down to the email row at the foot.
	func testContributingOffersEverySectionWithFeedbackFirst() throws {
		let contributing = HomeScreen(app: app).checkHomescreenExists().openContributing()
		let ids = TestIdentifiers.Contributing.self

		let github = contributing.row(ids.github)
		XCTAssertTrue(github.waitForExistence(timeout: 10), "Contributing should offer GitHub")
		for title in [ids.reportProblem, ids.email] {
			let row = contributing.row(title)
			XCTAssertTrue(row.exists, "\(title) should be on screen when Contributing opens")
			XCTAssertLessThan(row.frame.minY, github.frame.minY, "\(title) should sit above GitHub")
		}
		contributing.capture("contributing")

		contributing.openReportAProblem().closeProblemForm()
		XCTAssertTrue(
			contributing.host.waitForExistence(timeout: 10), "Closing the form should return to Contributing")

		for title in [ids.openStreetMap, ids.firstDataSource] {
			contributing.reveal(title)
		}
		contributing.capture("contributing-middle")

		contributing.reveal(ids.email)
		contributing.capture("contributing-bottom")
	}
}
