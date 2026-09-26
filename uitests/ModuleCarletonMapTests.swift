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

	/// Selecting a building moves the camera to it; the sheet then changing
	/// stop does not, as in Apple Maps. Collapsing the card is the move that
	/// shows it: the map above the middle stop stays in view, so a camera
	/// re-padded for the shorter sheet would slide it.
	func testTheMapHoldsStillWhenTheCardChangesStop() throws {
		let screen = CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.tapAFootprint()
			.verifyCardAtMedium()
		let region = screen.mapAboveSheet()
		let before = screen.settledMap(in: region)

		screen
			.collapseCard()
			.verifyCardCollapsed()
			.capture("Carleton map after the card collapses")
			.verifyMapHeldStill(since: before, in: region)
	}

	/// Issue #7962: the collapsed card cut off the bottom of the building's
	/// name. A long name, because a short one fits whatever the header does.
	func testTheCollapsedCardHoldsItsWholeHeader() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.CarletonMap.aLongNamedBuilding)
			.selectBuilding(named: TestIdentifiers.CarletonMap.aLongNamedBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.capture("Carleton map card collapsed with a long name")
			.verifyCardHeaderWithinSheet()
	}

	/// St. Olaf's card adds a subtitle under the name, which Carleton's cards
	/// lack, so the collapsed header has two lines to hold instead of one.
	func testTheCollapsedStOlafCardHoldsItsWholeHeader() throws {
		CarletonMapScreen(app: app)
			.navigateFromMapTile()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.CarletonMap.aSubtitledStOlafBuilding)
			.selectBuilding(named: TestIdentifiers.CarletonMap.aSubtitledStOlafBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map card collapsed with a subtitle")
			.verifyCardHeaderWithinSheet()
	}

	/// At the largest text size the header is taller than the collapsed stop.
	/// The card has to keep its close button and the top of its name in view
	/// and let the rest run off the bottom, as Apple Maps does, rather than
	/// centre the header and cut off the close button.
	///
	/// A card with a subtitle, because a one-line header -- a Carleton card --
	/// still fits the stop at this size, and a centred header would pass.
	func testTheCollapsedCardKeepsItsHeaderTopAtTheLargestTextSize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		CarletonMapScreen(app: app)
			.navigateFromMapTile()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.CarletonMap.aSubtitledStOlafBuilding)
			.selectBuilding(named: TestIdentifiers.CarletonMap.aSubtitledStOlafBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map card collapsed at the largest text size")
			.verifyCardHeaderTopWithinSheet()
	}
}
