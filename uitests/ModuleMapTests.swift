import XCTest

class ModuleMapTests: UITestCase {
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
	/// Like Maps, the map runs under a clear header, and the credits the
	/// tiles' licence requires sit in a menu there.
	func testTheMapRunsUnderAClearHeaderWithItsCredits() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("The map under its clear header")
			.verifyClearHeaderWithCredits()
	}

	/// At the largest text size the search field grows to fit its text, and
	/// the collapsed stop grows with it, as Apple Maps' does: the whole field
	/// stays inside the sheet with a margin above and below it.
	func testTheCollapsedSheetHoldsTheSearchFieldAtTheLargestTextSize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("St. Olaf map sheet collapsed at the largest text size")
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyFieldHasMarginsInSheet()
	}

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
	private let cardSections = ["Hours", "About", "Good to Know", "Departments", "Offices", "Floors", "Links", "Details"]

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
			// Tomson's Hours offices with no department link of their own join
			// Offices.
			.verifySectionOrder(
				["Hours", "About", "Good to Know", "Departments", "Offices", "Links"], among: cardSections)
	}

	/// A building's card shows its own hours -- a status row, then the week
	/// -- after the photo's place and before About.
	func testACardShowsItsBuildingsOwnHours() throws {
		let name = TestIdentifiers.Map.aBuildingWithALongAbout
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.capture("Holland Hall's card at the middle stop")
			.verifyHoursStatus()
			.expandCard()
			.capture("Holland Hall's card at the large stop")
			.verifySectionOrder(["Hours", "About", "Good to Know", "Links"], among: cardSections)
	}

	/// Closing a card returns to the list as it was left: the same category,
	/// scrolled to the same place. Checked at the middle stop, where a row tap
	/// leaves the sheet and so where the list is seen again.
	func testClosingACardKeepsTheListsPlace() throws {
		let category = TestIdentifiers.Map.parkingCategory
		let name = TestIdentifiers.Map.aRowFarDownParking
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.chooseCategory(category)
		let offset = screen.scrollListToReach(name)
		screen
			.selectBuilding(named: name)
			.closeTopCard()
			.verifyListKeptItsPlace(category: category, row: name, offset: offset)
	}

	/// A point inside a building with one venue of its own shows that venue's
	/// hours, whatever kind of venue it is.
	func testAPointShowsItsOwnHours() throws {
		let name = TestIdentifiers.Map.aPointWithItsOwnHours
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.capture("The Cage's card at the middle stop")
			.verifyHoursStatus()
			.expandCard()
			.capture("The Cage's card at the large stop")
	}

	/// A place's card lists what else is there, and each opens its own card in
	/// a sheet over it, as Maps stacks place sheets.
	func testAPlacesCardListsWhatElseIsThere() throws {
		let name = TestIdentifiers.Map.aBuildingWithPoints
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.capture("Buntrock's card, with what else is there")
			.verifySectionOrder(
				[TestIdentifiers.Map.alsoHereSection, "About"],
				among: [TestIdentifiers.Map.alsoHereSection, "About"])
	}

	func testATileOpensItsCardOverTheCardBeneath() throws {
		let name = TestIdentifiers.Map.aBuildingWithPoints
		let point = TestIdentifiers.Map.aPointInside
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.openPlaceTile(named: point)
		sleep(1)
		screen
			.capture("The Cage stacked over Buntrock")
			.verifyTopCard(point)
			.closeTopCard()
		sleep(1)
		screen
			.capture("Back on Buntrock")
			.verifyTopCard(name)
	}

	func testAnOfficeOpensItsOwnCard() throws {
		let name = TestIdentifiers.Map.aBuildingWithManyDepartments
		let office = TestIdentifiers.Map.anOffice
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.openPlaceTile(named: office)
		sleep(1)
		screen
			.capture("The Registrar's card over Tomson Hall")
			.verifyTopCard(office)
			.verifyHoursStatus()
	}

	/// A building's Directory lists its floors; a floor stacks its sheet over
	/// the card, and a place on it stacks its own card over the floor.
	func testAFloorOpensWhatIsOnIt() throws {
		let name = TestIdentifiers.Map.aBuildingWithADirectory
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.openDirectoryFloor(TestIdentifiers.Map.aDirectoryFloorIndex)
			.verifyTopCard(TestIdentifiers.Map.aDirectoryFloor)
			.verifyFloorSheetOnTop()
			.capture("A floor of Tomson's Directory")
			.openDirectoryEntry(named: TestIdentifiers.Map.aDirectoryVenue)
			.verifyTopCard(TestIdentifiers.Map.aDirectoryVenue)
			.closeTopCard()
			.verifyTopCard(TestIdentifiers.Map.aDirectoryFloor)
			.verifyFloorSheetOnTop()
			.closeTopCard()
			.verifyBaseCardAnswersTouch(name)
	}

	/// Tapping the map while cards are stacked starts afresh from the place
	/// tapped, rather than leaving a sheet over the new card.
	func testTappingTheMapStartsAfresh() throws {
		let name = TestIdentifiers.Map.aBuildingWithPoints
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.openPlaceTile(named: TestIdentifiers.Map.aPointInside)
		sleep(1)
		screen.tapAFootprint()
		sleep(2)
		screen.capture("After a footprint tap over a stacked sheet")
		let closes = app.buttons.matching(identifier: TestIdentifiers.Map.cardCloseButton)
			.allElementsBoundByIndex.filter { $0.isHittable }
		XCTAssertEqual(closes.count, 1, "A tap on the map should leave one card, not a stack")
	}
}
