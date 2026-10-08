import XCTest

// A test for a cancelled swipe back keeping the search query lived here until
// 2026-09-11. The behaviour is real, but the gesture is not: UIKit decides an
// interactive pop from how far the finger travelled and how fast, and a drag
// deliberately close to that threshold is resolved the other way by a loaded
// hosted runner. It passed locally in about eighteen seconds and failed all
// three attempts on every runner, so it sat permanently XCTSkipIf'd -- paying a
// cold launch per run to do nothing. Worth restoring if the gesture can ever be
// driven at a speed a runner cannot misread.
/// Routes: /directory
class ModuleDirectoryTests: UITestCaseUnbooted {

	/// The landing grid and a contact's sheet, from opening to swiping away.
	///
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
			.verifyContactsHeading()
			.verifyContactTileIsSquare(TestIdentifiers.Directory.aContact)
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.verifyContactGridStillBehind()
			.dismissContactSheet(
				titled: TestIdentifiers.Directory.aContact,
				waitingFor: TestIdentifiers.Directory.aContactAction)
			.verifyContactsHeading()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyDetailAction(TestIdentifiers.Directory.aContactAction)
			.attemptToTapContactBehindSheet(
				TestIdentifiers.Directory.aSecondContact,
				whileShowing: TestIdentifiers.Directory.aContact)
			.verifyNoSecondContactSheet(TestIdentifiers.Directory.aSecondContactAction)
	}
}
