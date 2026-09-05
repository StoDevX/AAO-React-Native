import XCTest

class ModuleDirectoryTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyDirectoryTitle()
			.checkSearchPromptVisible()
	}

	/// The search field holds the query and nothing else does, so a swipe back
	/// that is begun and then abandoned has to give it back intact -- otherwise
	/// the reader returns to a list of results with nothing on screen saying
	/// what was searched for.
	func testCancelledSwipeBackKeepsTheQuery() throws {
		DirectoryScreen(app: app)
			.navigate()
			.search(for: "olaf")
			.cancelSwipeBack()
			.verifyDirectoryTitle()
			.capture("Directory after a cancelled swipe back")
			.verifySearchText("olaf")
	}
}
