import XCTest

class ModuleMapTests: UITestCase {
	/// The bar reports each keystroke to JavaScript and takes the echo back as
	/// a prop, which is a round trip with a race in it. Typing a whole name is
	/// what shows whether a character was lost on the way: the field is read
	/// back, and a building the query cannot match has to leave the list, which
	/// is the half that can only happen if the text arrived in JavaScript.
	func testTypingIntoSearchKeepsEveryCharacter() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.capture("St. Olaf map list before a query is typed")
			.verifyListed(TestIdentifiers.Map.anotherBuilding)
			.typeIntoSearch(TestIdentifiers.Map.aBuilding)
			.capture("St. Olaf map sheet with a typed query")
			.verifyFilteredOut(TestIdentifiers.Map.anotherBuilding)
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
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("St. Olaf map sheet collapsed")
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyCollapsedMarginsSymmetric()
			.verifyAttributionClearOfSheet()
		let collapsedTop = screen.searchFieldTop()

		screen
			.focusSearch()
			.capture("St. Olaf map sheet raised by search focus")
			.verifySheetMoved(from: collapsedTop, direction: "up", "Focusing search should raise the sheet to large")
			.cancelSearch()
			.capture("St. Olaf map sheet after cancelling search")
			.verifySheetReturned(to: collapsedTop)
			.verifyCollapsed()
			.tapAFootprint()
			.capture("St. Olaf map card after a footprint tap from collapsed")
			.verifyCardAtMedium()
	}

	/// The full sheet, and a row tapped from it.
	///
	/// The module pins the field at 44pt with a constraint UIKit is free to
	/// overrule silently, so the height is checked before anything else moves
	/// the sheet.
	///
	/// `aBuilding` is absent from Carleton's map, so this also fails if the Map
	/// tile forwarded the wrong campus, or none at all, to `/Map` -- which falls
	/// back to Carleton.
	func testTheFullSheetDropsToMediumForARow() throws {
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.verifySearchFieldHeight()
		let largeTop = screen.searchFieldTop()

		screen
			.selectBuilding(named: TestIdentifiers.Map.aBuilding)
			.capture("St. Olaf map card after a row tap from large")
			.verifyCardDroppedFrom(largeTop)
			.verifyCardAtMedium()
	}

	/// Selecting a building moves the camera to it; the sheet then changing
	/// stop does not, as in Apple Maps. Collapsing the card is the move that
	/// shows it: the map above the middle stop stays in view, so a camera
	/// re-padded for the shorter sheet would slide it.
	func testTheMapHoldsStillWhenTheCardChangesStop() throws {
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.tapAFootprint()
			.verifyCardAtMedium()
		let region = screen.mapAboveSheet()
		let before = screen.settledMap(in: region)

		screen
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map after the card collapses")
			.verifyMapHeldStill(since: before, in: region)
	}

	/// Issue #7962: the collapsed card cut off the bottom of the building's
	/// name. A long name with a subtitle under it, because that is the most the
	/// collapsed header has to hold, and a short one fits whatever it does.
	func testTheCollapsedCardHoldsItsWholeHeader() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aSubtitledBuilding)
			.selectBuilding(named: TestIdentifiers.Map.aSubtitledBuilding)
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
	/// A card with a subtitle, because a one-line header still fits the stop
	/// at this size, and a centred header would pass.
	func testTheCollapsedCardKeepsItsHeaderTopAtTheLargestTextSize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aSubtitledBuilding)
			.selectBuilding(named: TestIdentifiers.Map.aSubtitledBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map card collapsed at the largest text size")
			.verifyCardHeaderTopWithinSheet()
	}

	/// Every heading a card can have, for placing the ones a card shows.
	private let cardSections = ["About", "Good to Know", "Departments", "Offices", "Floors", "Links", "Details"]

	/// A St. Olaf card lays its sections out in Maps' order, and More on a long
	/// Departments section opens every one of them.
	func testAStOlafCardListsItsSectionsInMapsOrder() throws {
		let name = TestIdentifiers.Map.aBuildingWithManyDepartments
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.capture("Tomson Hall's card at the large stop")
			.verifySectionOrder(["About", "Good to Know", "Departments", "Links"], among: cardSections)
	}

	func testMoreOpensEveryDepartmentInAGrid() throws {
		let name = TestIdentifiers.Map.aBuildingWithManyDepartments
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.verifyMoreShowsEveryDepartment(21)
	}

	func testAboutExpandsFromItsFirstFiveLines() throws {
		let name = TestIdentifiers.Map.aBuildingWithALongAbout
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.capture("Holland Hall's About, clamped")
			.verifyAboutExpands()
	}

	/// A Carleton card carries what St. Olaf's feed lacks: a photo, an address
	/// and accessibility. Its photo is a square tile that opens full screen
	/// over the sheet, and opens again after closing, at the middle stop and
	/// at the large one, leaving the card where it was each time.
	func testACarletonCardShowsItsPhotoAndDetails() throws {
		let name = TestIdentifiers.Map.aCarletonBuildingWithAPhoto
		MapScreen(app: app)
			.navigateToCarleton()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.verifyCardAtMedium()
			.verifyPhotoOpensFullScreenTwice()
			.expandCard()
			.capture("Sayles-Hill's card at the large stop")
			.verifyPhotoTileSquare()
			.verifyPhotoOpensFullScreenTwice()
			.verifySectionOrder(["About", "Good to Know", "Offices", "Floors", "Details"], among: cardSections)
	}
}
