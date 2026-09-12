import XCTest

// A test for a cancelled swipe back keeping the search query lived here until
// 2026-09-11. The behaviour is real, but the gesture is not: UIKit decides an
// interactive pop from how far the finger travelled and how fast, and a drag
// deliberately close to that threshold is resolved the other way by a loaded
// hosted runner. It passed locally in about eighteen seconds and failed all
// three attempts on every runner, so it sat permanently XCTSkipIf'd -- paying a
// cold launch per run to do nothing. Worth restoring if the gesture can ever be
// driven at a speed a runner cannot misread.
class ModuleDirectoryTests: UITestCase {

	/// Every contact in data/contact-info/ gets a tile. The count is the point:
	/// a grid that silently drops the last row still looks right in isolation.
	func testShowsEveryContactBeforeASearch() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyDirectoryTitle()
			.verifyContactsHeading()
			.verifyContactTiles(count: 8)
			.capture("Directory contact grid")
	}

	/// A contact is read and dismissed, so it presents as a sheet rather than
	/// a push -- and the grid staying in the hierarchy behind it is the tell.
	/// A push would replace the grid, so this fails outright on one.
	///
	/// Reaching the detail at all is covered here too, by the action button:
	/// it appears only on the detail, the grid's tile merely navigating, so
	/// finding it is proof the tap went somewhere.
	func testTappingAContactPresentsASheet() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.verifyContactGridStillBehind()
			.capture("Contact detail as a sheet")
	}

	/// The contact sheet carries no close button, and a formSheet route has no
	/// back button either -- the drag is the only way out. If it does not
	/// dismiss, the reader is stuck on a contact with no way back to the grid.
	func testTheContactSheetCanBeSwipedAway() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.dismissContactSheet(
				titled: TestIdentifiers.Directory.aContact,
				waitingFor: TestIdentifiers.Directory.aContactAction)
			.capture("Directory after dismissing a contact sheet")
			.verifyContactsHeading()
			.verifyContactTiles(count: 8)
	}

	/// `sheetLargestUndimmedDetentIndex: 'none'` is what makes this true: UIKit
	/// dims and blocks touches to the grid behind the sheet at every detent,
	/// not merely below the largest one. Without it, a tap on another
	/// contact's tile reaches the grid and stacks a second sheet on the first.
	func testTappingATileBehindTheSheetDoesNotStackASecondSheet() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.attemptToTapContactBehindSheet(
				TestIdentifiers.Directory.aSecondContact,
				whileShowing: TestIdentifiers.Directory.aContact)
			.capture("Directory after tapping a tile behind the contact sheet")
			.verifyNoSecondContactSheet(TestIdentifiers.Directory.aSecondContactAction)
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

	/// A screen opened from a department link is showing that department, and
	/// the title says so. Cancelling a search the reader never started has to
	/// leave both alone -- otherwise the list empties while the title goes on
	/// naming a department, and the only way back is to navigate in again.
	func testCancellingSearchKeepsTheLinkedDepartment() throws {
		let department = TestIdentifiers.Directory.fixtureEntryDepartment

		DirectoryScreen(app: app)
			.navigate()
			.search(for: "testerson")
			.openDepartment(
				of: TestIdentifiers.Directory.fixtureEntry, named: department)
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
		let department = TestIdentifiers.Directory.fixtureEntryDepartment

		DirectoryScreen(app: app)
			.navigate()
			.search(for: "testerson")
			.openDepartment(
				of: TestIdentifiers.Directory.fixtureEntry, named: department)
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
	///
	/// Driven from a department link rather than a typed search: the toggle
	/// shares the bottom toolbar with the search field, and while that field is
	/// active the toolbar holds only its own Clear and Close buttons. A
	/// department's results arrive with the field idle, which is the one state
	/// where the toggle is on screen to tap.
	func testTheResultsToggleSwitchesTheView() throws {
		DirectoryScreen(app: app)
			.navigate()
			.search(for: "testerson")
			.openDepartment(
				of: TestIdentifiers.Directory.fixtureEntry,
				named: TestIdentifiers.Directory.fixtureEntryDepartment)
			.verifyResultsGalleried()
			.showAsList()
			.verifyResultsListed()
			.capture("Directory search results as a list")
			.showAsTiles()
			.verifyResultsGalleried()
	}

	/// A directory *entry*, reached by searching -- not an Important Contact
	/// tile, which pushes `Directory/named/[title]`, a different screen this
	/// migration has not touched.
	func testDirectoryEntryDetail() throws {
		let screen = DirectoryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Directory.fixtureEntry)

		// The tile gallery is the default view, so a result is a tile rather
		// than a row -- both open the same entry detail.
		let result = app.descendants(matching: .any)
			.matching(
				NSPredicate(
					format: "identifier BEGINSWITH %@", TestIdentifiers.Directory.tilePrefix))
			.firstMatch
		XCTAssertTrue(result.waitForExistence(timeout: 30), "A directory result should be shown")
		result.tap()

		// Wait for something only the pushed screen has: a capture taken
		// straight after the tap lands mid-animation, with both screens in it.
		let department = app.descendants(matching: .any)
			.matching(
				NSPredicate(
					format: "label CONTAINS %@", TestIdentifiers.Directory.fixtureEntryDepartment))
			.firstMatch
		XCTAssertTrue(department.waitForExistence(timeout: 30), "The entry detail should be shown")

		screen.capture("Directory - entry detail")
	}
}
