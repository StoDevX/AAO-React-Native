import XCTest

class ModuleMapTests: UITestCaseUnbooted {
	/// The collapsed sheet, and the two things that raise it.
	///
	/// The sheet opens on its smallest stop, at the foot of the screen, holding
	/// the whole search field and nothing else. The margins are read in screen
	/// space rather than taken from the layout numbers that went in: UIKit
	/// shrinks a presented sheet by a scale that depends on the detent, so a
	/// symmetric inset going in is not necessarily a symmetric one coming out.
	///
	/// Focusing search raises the sheet and cancelling puts it back, which
	/// leaves it collapsed for the footprint tap that opens a card.
	///
	/// Selecting that building moves the camera to it; the card then changing
	/// stop does not, as in Apple Maps. Collapsing the card is the move that
	/// shows it: the map above the middle stop stays in view, so a camera
	/// re-padded for the shorter sheet would slide it.
	///
	/// Last, like Maps, the map runs under a clear header, and the credits the
	/// tiles' licence requires sit in a menu there. It comes last because the
	/// menu it opens is left open.
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
		let region = screen.mapAboveSheet()
		let before = screen.settledMap(in: region)

		screen
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map after the card collapses")
			.verifyMapHeldStill(since: before, in: region)
			.verifyClearHeaderWithCredits()
	}

	/// The largest text size, which all of these share as a launch argument.
	///
	/// The search field grows to fit its text, and the collapsed stop grows
	/// with it, as Apple Maps' does: the whole field stays inside the sheet with
	/// a margin above and below it.
	///
	/// The categories are then a list: a grid narrow enough to fit would leave
	/// each label a word or two a line. A group's title wraps or shrinks beside
	/// its back button rather than drawing under it.
	///
	/// Last, a card's header is taller than the collapsed stop. The card has to
	/// keep its close button and the top of its name in view and let the rest
	/// run off the bottom, as Apple Maps does, rather than centre the header
	/// and cut off the close button. A card with a subtitle, because a one-line
	/// header still fits the stop at this size, and a centred header would pass.
	func testTheCollapsedSheetHoldsTheSearchFieldAtTheLargestTextSize() throws {
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.capture("St. Olaf map sheet collapsed at the largest text size")
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyFieldHasMarginsInSheet()
			.expandSheet()
			.capture("St. Olaf map categories at the largest text size")
			// The first row: at this size the sheet may rest short of its full
			// stop, and a list builds only the rows it shows.
			.verifyCategoriesAsList(including: TestIdentifiers.Map.buildingsCategory)
			.openCategory(TestIdentifiers.Map.buildingsCategory)
			.capture("St. Olaf map Buildings group at the largest text size")
			.verifyGroupTitleClearsBackButton(TestIdentifiers.Map.buildingsCategory)
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aSubtitledBuilding)
			.selectBuilding(named: TestIdentifiers.Map.aSubtitledBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.capture("St. Olaf map card collapsed at the largest text size")
			.verifyCardHeaderTopWithinSheet()
	}

	/// The full sheet, and a row tapped from it, reached through the grid.
	///
	/// The module pins the field at 44pt with a constraint UIKit is free to
	/// overrule silently, so the height is checked before anything else moves
	/// the sheet.
	///
	/// The grid's bottom-left tile draws its whole name. The grid is a row of
	/// the sheet's list, and the list clips each row to its card's rounded
	/// corners, which once cut the foot off that tile's first letter.
	///
	/// A group opens its places under a header naming it, and Back returns to
	/// the grid, as Maps does for a shopping centre.
	///
	/// `aBuilding` is absent from Carleton's map, so this also fails if the Map
	/// tile forwarded the wrong campus, or none at all, to `/map` -- which falls
	/// back to Carleton.
	func testTheFullSheetDropsToMediumForARow() throws {
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.verifySearchFieldHeight()
			.capture("St. Olaf map category grid")
			.verifyTileNameDrawnWhole(TestIdentifiers.Map.cornerCategory)
			.openCategory(TestIdentifiers.Map.diningCategory)
			.capture("St. Olaf map Dining group")
			.verifyGroupOpen(TestIdentifiers.Map.diningCategory)
			.goBackToCategories()
			.openCategory(TestIdentifiers.Map.buildingsCategory)
			// Opening a group drops the sheet to make room for its pins.
			.expandSheet()
		let largeTop = screen.searchFieldTop()

		screen
			.selectBuilding(named: TestIdentifiers.Map.aBuilding)
			.capture("St. Olaf map card after a row tap from large")
			.verifyCardDroppedFrom(largeTop)
			.verifyCardAtMedium()
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

	/// Once expanded, a card's About text can be selected and copied. Cut
	/// short, it cannot: a copy then would hold only the lines on screen.
	func testAnExpandedAboutCanBeCopied() throws {
		let name = TestIdentifiers.Map.aBuildingWithALongAbout
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.verifyAboutOffersCopy(false)
			.expandAbout()
			.verifyAboutOffersCopy(true)
	}

	/// Closing a card returns to the list as it was left: the same group,
	/// scrolled to the same place. Checked at the middle stop, where a row tap
	/// leaves the sheet and so where the list is seen again.
	func testClosingACardKeepsTheListsPlace() throws {
		let category = TestIdentifiers.Map.parkingCategory
		let name = TestIdentifiers.Map.aRowFarDownParking
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(category)
			// Parking's many places merge into numbered clusters.
			.capture("St. Olaf map Parking clusters")
		let offset = screen.scrollListToReach(name)
		screen
			.selectBuilding(named: name)
			.closeTopCard()
			.verifyListKeptItsPlace(category: category, row: name, offset: offset)
	}

	/// A place's card lists what else is there, and each opens its own card in
	/// a sheet over it, as Maps stacks place sheets; the point's card shows
	/// its own venue's hours. Tapping the map while cards are stacked then
	/// starts afresh from the place tapped, rather than leaving a sheet over the
	/// new card.
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
			.verifyHoursStatus()
			.closeTopCard()
		sleep(1)
		screen
			.capture("Back on Buntrock")
			.verifyTopCard(name)
			.openPlaceTile(named: point)
		sleep(1)
		screen.tapAFootprint()
		sleep(2)
		screen.capture("After a footprint tap over a stacked sheet")
		let closes = app.buttons.matching(identifier: TestIdentifiers.Map.cardCloseButton)
			.allElementsBoundByIndex.filter { $0.isHittable }
		XCTAssertEqual(closes.count, 1, "A tap on the map should leave one card, not a stack")
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

	/// A search that finds one place frames its pin above the sheet, and the
	/// pin opens that place -- not the building its point sits inside.
	func testASearchedPinOpensItsOwnCard() throws {
		let name = TestIdentifiers.Map.aPointOnlyPlace
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.submitSearch()
			.capture("St. Olaf map with one searched pin")
			.verifyAtMiddleStop()
			.tapMapCenterAboveSheet()
			.capture("St. Olaf map after tapping the searched pin")
			.verifyCardTitled(name)
	}

	/// The base map's own name for a place inside a building opens that place,
	/// not the building around it. Searching frames the place's pin at a known
	/// spot; cancelling takes the pin away and leaves the camera, so the base
	/// map's label for the place is what is under that spot.
	///
	/// The cancel is also the check that Close ends a search in one tap after
	/// the keyboard's Search key has already ended editing, as Apple Maps' X
	/// does -- rather than putting the field back into editing and needing a
	/// second tap.
	func testATappedPlaceNameOpensItsOwnCard() throws {
		let name = TestIdentifiers.Map.aPointOnlyPlace
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.submitSearch()
			.verifyAtMiddleStop()
			.verifyKeyboardHidden()
			.capture("St. Olaf map after submitting a search")
		let spot = screen.mapCenterAboveSheet()
		screen
			.cancelSearch()
			.verifyKeyboardHidden()
			.verifySearchFieldEmpty()
			.capture("St. Olaf map with the searched place's own label")
			.tapMap(at: spot)
			.capture("St. Olaf map after tapping a place's label")
			.verifyCardTitled(name)
	}

	/// A place opened from the map is listed under Recents on the root view,
	/// and a swipe takes it off again.
	func testAnOpenedPlaceIsListedUnderRecents() throws {
		let name = TestIdentifiers.Map.aPointOnlyPlace
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.closeTopCard()
			.cancelSearch()
			.expandSheet()
			.capture("St. Olaf map Recents")
			.verifyRecentsList(name)
			.removeRecent(name)
			.verifyNoRecents()
	}
}
