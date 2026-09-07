import XCTest

class ModuleDirectoryTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyDirectoryTitle()
			.verifyContactsHeading()
	}

	/// Every contact in data/contact-info/ gets a tile. The count is the point:
	/// a grid that silently drops the last row still looks right in isolation.
	func testShowsEveryContactBeforeASearch() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyContactTiles(count: 8)
			.capture("Directory contact grid")
	}

	func testTappingAContactOpensItsDetail() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
	}

	/// At an accessibility Dynamic Type size the label and glyph both grow,
	/// but a fixed column count's width would not -- columnsForFontScale is
	/// what narrows the grid to keep it readable there instead of clipping.
	/// The count staying at eight (not the column count, which this test
	/// cannot see from the accessibility tree) is what proves the reflow
	/// happened rather than the grid just running off the edge of the screen.
	func testShowsEveryContactAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		DirectoryScreen(app: app)
			.navigate()
			.verifyContactTiles(count: 8)
			.capture("Directory contact grid at an accessibility size")
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
			.verifyResultsShown()
			.cancelSearch()
			.capture("Directory department screen after cancelling search")
			.verifyDepartmentHeading(department)
			.verifyResultsShown()
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
			.verifyResultsShown()
	}

	/// Faces read faster than a column of names, so a search opens on the tile
	/// gallery unless the reader has switched away from it before.
	func testSearchResultsOpenAsTiles() throws {
		DirectoryScreen(app: app)
			.navigate()
			.search(for: "olaf")
			.verifyResultsGalleried()
			.capture("Directory search results as a tile gallery")
	}

	/// The toolbar button swaps the results between the gallery and the list,
	/// both ways.
	func testTheResultsToggleSwitchesTheView() throws {
		DirectoryScreen(app: app)
			.navigate()
			.search(for: "olaf")
			.verifyResultsGalleried()
			.showAsList()
			.verifyResultsListed()
			.capture("Directory search results as a list")
			.showAsTiles()
			.verifyResultsGalleried()
	}
}
