import XCTest

class ModuleContributingTests: UITestCase {
	func testContributingOffersEverySection() throws {
		let contributing = HomeScreen(app: app).checkHomescreenExists().openContributing()
		let ids = TestIdentifiers.Contributing.self

		XCTAssertTrue(
			contributing.row(ids.github).waitForExistence(timeout: 10), "Contributing should offer GitHub")
		contributing.capture("contributing")

		for title in [ids.reportProblem, ids.openStreetMap, ids.firstDataSource] {
			contributing.reveal(title)
		}
		contributing.capture("contributing-middle")

		contributing.reveal(ids.email)
		contributing.capture("contributing-bottom")
	}

	func testReportAProblemOpensTheForm() throws {
		let contributing = HomeScreen(app: app).checkHomescreenExists().openContributing()
		let ids = TestIdentifiers.Contributing.self

		contributing.reveal(ids.reportProblem)
		contributing.row(ids.reportProblem).tap()
		let form = app.navigationBars[TestIdentifiers.Support.reportProblemTitle]
		XCTAssertTrue(form.waitForExistence(timeout: 30), "Report a Problem should open its form")

		app.buttons[TestIdentifiers.Support.closeProblemForm].firstMatch.tap()
		XCTAssertTrue(form.waitForNonExistence(timeout: 10), "The form should close")
		XCTAssertTrue(
			contributing.host.waitForExistence(timeout: 10), "Closing the form should return to Contributing")
	}
}
