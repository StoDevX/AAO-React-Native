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

	/// The landing grid and a contact's sheet, from opening to swiping away.
	///
	/// Every contact in data/contact-info/ gets a tile. The count is the point:
	/// a grid that silently drops the last row still looks right in isolation.
	/// Contact cards are square so that three rows of them leave the
	/// department list in view below the grid.
	///
	/// A contact is read and dismissed, so it presents as a sheet rather than
	/// a push -- and the grid staying in the hierarchy behind it is the tell.
	/// A push would replace the grid, so this fails outright on one. Reaching
	/// the detail at all is covered too, by the action button: it appears only
	/// on the detail, the grid's tile merely navigating, so finding it is proof
	/// the tap went somewhere.
	///
	/// The contact sheet carries no close button, and a formSheet route has no
	/// back button either -- the drag is the only way out. If it does not
	/// dismiss, the reader is stuck on a contact with no way back to the grid.
	///
	/// Tapping a tile behind the sheet comes last, on a sheet opened afresh,
	/// because that tap is allowed to dismiss the sheet.
	/// `sheetLargestUndimmedDetentIndex: 'none'` is what makes it safe: UIKit
	/// dims and blocks touches to the grid behind the sheet at every detent,
	/// not merely below the largest one. Without it, a tap on another
	/// contact's tile reaches the grid and stacks a second sheet on the first.
	func testTheContactGridAndItsSheet() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyDirectoryTitle()
			.verifyContactsHeading()
			.verifyContactTiles(count: 11)
			.capture("Directory contact grid")
			.verifyContactTileIsSquare(TestIdentifiers.Directory.aContact)
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.verifyContactGridStillBehind()
			.capture("Contact detail as a sheet")
			.dismissContactSheet(
				titled: TestIdentifiers.Directory.aContact,
				waitingFor: TestIdentifiers.Directory.aContactAction)
			.capture("Directory after dismissing a contact sheet")
			.verifyContactsHeading()
			.verifyContactTiles(count: 11)
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.attemptToTapContactBehindSheet(
				TestIdentifiers.Directory.aSecondContact,
				whileShowing: TestIdentifiers.Directory.aContact)
			.capture("Directory after tapping a tile behind the contact sheet")
			.verifyNoSecondContactSheet(TestIdentifiers.Directory.aSecondContactAction)
	}

	/// A contact carries either a phone number or a link, and its one button
	/// follows whichever it has. The other tests here all open a contact that
	/// places a call, so this is the only one that reaches the link branch.
	func testALinkContactOpensItsPage() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aLinkContact)
			.verifyDetailAction(TestIdentifiers.Directory.aLinkContactAction)
			.followDetailLink(TestIdentifiers.Directory.aLinkContactAction)
			.capture("Contact link opened in the in-app browser")
	}

	/// At an accessibility Dynamic Type size the label and glyph both grow,
	/// but a fixed column count's width would not -- columnsForFontScale is
	/// what narrows the grid to keep it readable there instead of clipping.
	/// The count staying at eleven (not the column count, which this test
	/// cannot see from the accessibility tree) is what proves the reflow
	/// happened rather than the grid just running off the edge of the screen.
	func testShowsEveryContactAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		DirectoryScreen(app: app)
			.navigate()
			.verifyContactTiles(count: 11)
			.capture("Directory contact grid at an accessibility size")
	}

	/// A screen opened from a department link: what it shows, how its results
	/// can be viewed, and what cancelling search leaves behind.
	///
	/// The title stays "Directory" wherever the screen was opened from, so a
	/// department has to name itself above its own results -- otherwise nothing
	/// on screen says whose names these are.
	///
	/// The toolbar button swaps the results between the gallery and the list,
	/// both ways. It is tested here rather than after a typed search: the
	/// toggle shares the bottom toolbar with the search field, and while that
	/// field is active the toolbar holds only its own Clear and Close buttons.
	/// A department's results arrive with the field idle, which is the one
	/// state where the toggle is on screen to tap -- so the toggle goes before
	/// the cancel.
	///
	/// Cancelling a search the reader never started has to leave the
	/// department and its title alone -- otherwise the list empties while the
	/// title goes on naming a department, and the only way back is to navigate
	/// in again.
	func testALinkedDepartmentNamesItselfTogglesAndSurvivesCancel() throws {
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
			.verifyResultsGalleried()
			.showAsList()
			.verifyResultsListed()
			.capture("Directory search results as a list")
			.showAsTiles()
			.verifyResultsGalleried()
			.cancelSearch()
			.capture("Directory department screen after cancelling search")
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

	/// A department opens a fresh copy of this screen over the landing. The
	/// two share a route, and navigating to the route already on top only
	/// swaps its params -- which leaves nothing beneath the department for
	/// Back to return to.
	func testADepartmentOpensOverTheLanding() throws {
		let screen = DirectoryScreen(app: app).navigate()
		let department = screen.openFirstDepartment()

		screen
			.verifyDepartmentHeading(department)
			.capture("Directory department opened from the landing")
			.leaveDepartmentForLanding()
	}
}
