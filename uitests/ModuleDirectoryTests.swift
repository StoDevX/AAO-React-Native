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

	/// A screen opened from a department link is showing that department, and
	/// the title says so. Cancelling a search the reader never started has to
	/// leave both alone -- otherwise the list empties while the title goes on
	/// naming a department, and the only way back is to navigate in again.
	func testCancellingSearchKeepsTheLinkedDepartment() throws {
		let department = TestIdentifiers.Directory.department

		DirectoryScreen(app: app)
			.navigate()
			.search(for: "registrar")
			.openDepartment(
				of: TestIdentifiers.Directory.departmentalEntry, named: department)
			.verifyDepartmentHeading(department)
			.verifyResultsListed()
			.cancelSearch()
			.capture("Directory department screen after cancelling search")
			.verifyDepartmentHeading(department)
			.verifyResultsListed()
	}

	/// The title stays "Directory" wherever the screen was opened from, so a
	/// department has to name itself above its own results -- otherwise nothing
	/// on screen says whose names these are.
	func testDepartmentLinkIsNamedAboveTheResults() throws {
		let department = TestIdentifiers.Directory.department

		DirectoryScreen(app: app)
			.navigate()
			.search(for: "registrar")
			.openDepartment(
				of: TestIdentifiers.Directory.departmentalEntry, named: department)
			.capture("Directory opened from a department link")
			.verifyDirectoryTitle()
			.verifyDepartmentHeading(department)
			.verifyResultsListed()
	}
}
