import XCTest

class ModuleCarletonMapTests: UITestCase {
	/// The bar reports each keystroke to JavaScript and takes the echo back as
	/// a prop, which is a round trip with a race in it. Typing a whole name is
	/// what shows whether a character was lost on the way: the field is read
	/// back, and a building the query cannot match has to leave the list, which
	/// is the half that can only happen if the text arrived in JavaScript.
	func testTypingIntoSearchKeepsEveryCharacter() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.capture("Carleton map list before a query is typed")
			.verifyListed(TestIdentifiers.CarletonMap.anotherBuilding)
			.typeIntoSearch(TestIdentifiers.CarletonMap.aBuilding)
			.capture("Carleton map sheet with a typed query")
			.verifyFilteredOut(TestIdentifiers.CarletonMap.anotherBuilding)
	}

	/// The collapsed sheet, and the two things that raise it.
	///
	/// The sheet opens on its smallest stop, at the foot of the screen, holding
	/// the whole search field and nothing else. The margins are read in screen
	/// space rather than taken from the layout numbers that went in: UIKit
	/// shrinks a presented sheet by a scale that depends on the detent, so a
	/// symmetric inset going in is not necessarily a symmetric one coming out.
	///
	/// Focusing search raises the sheet and cancelling puts it back, which
	/// leaves it collapsed for the footprint tap that ends the test.
	func testTheCollapsedSheetRisesForSearchAndForAFootprint() throws {
		let screen = CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("Carleton map sheet collapsed")
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyCollapsedMarginsSymmetric()
			.verifyAttributionClearOfSheet()
		let collapsedTop = screen.searchFieldTop()

		screen
			.focusSearch()
			.capture("Carleton map sheet raised by search focus")
			.verifySheetMoved(from: collapsedTop, direction: "up", "Focusing search should raise the sheet to large")
			.cancelSearch()
			.capture("Carleton map sheet after cancelling search")
			.verifySheetReturned(to: collapsedTop)
			.verifyCollapsed()
			.tapAFootprint()
			.capture("Carleton map card after a footprint tap from collapsed")
			.verifyCardAtMedium()
	}

	/// The full sheet, and a row tapped from it.
	///
	/// The module pins the field at 44pt with a constraint UIKit is free to
	/// overrule silently, so the height is checked before anything else moves
	/// the sheet.
	func testTheFullSheetDropsToMediumForARow() throws {
		let screen = CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.verifySearchFieldHeight()
		let largeTop = screen.searchFieldTop()

		screen
			.selectBuilding(named: TestIdentifiers.CarletonMap.aBuilding)
			.capture("Carleton map card after a row tap from large")
			.verifyCardDroppedFrom(largeTop)
			.verifyCardAtMedium()
	}
}
