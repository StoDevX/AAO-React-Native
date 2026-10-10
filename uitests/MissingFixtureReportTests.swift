import XCTest

/// A request with no fixture fails the test by name.
/// Tags: campus:example.college
final class MissingFixtureReportTests: UITestCaseUnbooted {
	override class var campus: Campus? { .example }

	func testAnUnansweredRequestFailsNamingIt() throws {
		XCTExpectFailure("Wiki Monkeys has no fixture for this story") { issue in
			issue.compactDescription.contains("Missing fixtures for example.college:")
		}
		// No Valley Echo story has this id, so no fixture will ever answer its request.
		HomeScreen(app: app).open(route: "/newspaper/story?id=987654321", mountedWhen: app.windows.firstMatch)
		// The app writes the report as the request fails; the strict check in
		// tearDown turns it into the failure expected above.
		let reported = expectation(for: NSPredicate { _, _ in
			FileManager.default.fileExists(atPath: MissingFixtures.file.path)
		}, evaluatedWith: nil)
		wait(for: [reported], timeout: 30)
	}
}
