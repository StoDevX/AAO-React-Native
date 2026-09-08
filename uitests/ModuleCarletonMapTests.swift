import XCTest

class ModuleCarletonMapTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
	}

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

	/// The sheet opens on its smallest stop, at the foot of the screen. Whether
	/// that stop holds the field and nothing else is a question for the capture:
	/// see `verifyCollapsed` for why no assertion can answer it.
	func testSheetOpensOnItsCollapsedStop() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("Carleton map sheet collapsed")
			.verifyCollapsed()
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
	/// what shows whether a character was lost on the way.
	func testTypingIntoSearchKeepsEveryCharacter() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.CarletonMap.aBuilding)
			.capture("Carleton map sheet with a typed query")
			.verifySearchFound(TestIdentifiers.CarletonMap.aBuilding)
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
		// The picker is gone once the card is up, so the card's own top edge
		// stands in for the field's.
		let cardTop = screen.closeButtonTop()
		XCTAssertTrue(
			cardTop - largeTop > 100,
			"A row tapped from the full sheet should drop it to medium; the content's top went from \(largeTop) to \(cardTop)")
		screen.verifyCardAtMedium()
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
