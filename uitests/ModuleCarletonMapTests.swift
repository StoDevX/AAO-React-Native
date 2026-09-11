import XCTest

class ModuleCarletonMapTests: UITestCase {
	/// The whole path a user takes: open the map, reach into the sheet, and
	/// come out with a building's card.
	func testSelectingABuildingShowsItsCard() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.selectBuilding(named: TestIdentifiers.CarletonMap.aBuilding)
			.checkBuildingCardPresented()
			.capture("Carleton map sheet at its middle detent, showing a building's card")
	}

	/// The sheet opens on its smallest stop, at the foot of the screen, holding
	/// the whole search field. That the field is the only thing on the stop is
	/// still a question for the capture.
	func testSheetOpensOnItsCollapsedStop() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("Carleton map sheet collapsed")
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyAttributionClearOfSheet()
	}

	/// The module pins the field at 44pt with a constraint UIKit is free to
	/// overrule silently, so the height is worth a test of its own.
	func testTheSearchFieldIsAppleMapsHeight() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.verifySearchFieldHeight()
	}

	func testFocusingSearchRaisesTheSheetAndCancelReturnsIt() throws {
		let screen = CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
		let collapsedTop = screen.searchFieldTop()

		screen
			.focusSearch()
			.capture("Carleton map sheet raised by search focus")
			.verifySheetMoved(from: collapsedTop, direction: "up", "Focusing search should raise the sheet to large")
			.cancelSearch()
			.capture("Carleton map sheet after cancelling search")
			.verifySheetReturned(to: collapsedTop)
	}

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

	func testTappingARowFromTheFullSheetDropsItToMedium() throws {
		let screen = CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
		let largeTop = screen.searchFieldTop()

		screen
			.selectBuilding(named: TestIdentifiers.CarletonMap.aBuilding)
			.capture("Carleton map card after a row tap from large")
			.verifyCardDroppedFrom(largeTop)
			.verifyCardAtMedium()
	}

	/// UIKit shrinks the presented sheet by a scale that depends on the
	/// detent, so the collapsed content's margins have to be checked in
	/// screen space rather than assumed from the layout numbers that went in.
	func testCollapsedSheetHasSymmetricMargins() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.verifyCollapsedMarginsSymmetric()
			.verifyFieldWithinSheet()
	}

	func testTappingAFootprintWhileCollapsedRaisesTheCardToMedium() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.verifyCollapsed()
			.tapAFootprint()
			.capture("Carleton map card after a footprint tap from collapsed")
			.verifyCardAtMedium()
	}
}
