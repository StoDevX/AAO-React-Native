import XCTest

class ModuleContributingTests: UITestCase {
	/// The ways to reach us come first, above the source code, and Report a
	/// Problem opens its form and closes back to Contributing. Then every
	/// section is there, and the email row is still reachable from the foot.
	func testContributingOffersEverySectionWithFeedbackFirst() throws {
		let contributing = HomeScreen(app: app).checkHomescreenExists().openContributing()
		let ids = TestIdentifiers.Contributing.self

		let appSource = contributing.row(ids.appSource)
		XCTAssertTrue(appSource.waitForExistence(timeout: 10), "Contributing should offer the app's source")
		for title in [ids.reportProblem, ids.email] {
			let row = contributing.row(title)
			XCTAssertTrue(row.exists, "\(title) should be on screen when Contributing opens")
			XCTAssertLessThan(row.frame.minY, appSource.frame.minY, "\(title) should sit above the source code")
		}
		contributing.capture("contributing")

		contributing.openReportAProblem().closeProblemForm()
		XCTAssertTrue(
			contributing.host.waitForExistence(timeout: 10), "Closing the form should return to Contributing")

		for title in [ids.cccServer, ids.openStreetMap, ids.firstDataSource] {
			contributing.reveal(title)
		}
		contributing.capture("contributing-middle")

		contributing.reveal(ids.email)
		contributing.capture("contributing-email")
	}
}
