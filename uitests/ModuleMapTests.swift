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
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
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

	/// The full sheet, and a row tapped from it, reached through the grid's
	/// All Buildings group.
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
			.openCategory(TestIdentifiers.Map.allBuildingsCategory)
			// Opening a group drops the sheet to make room for its pins.
			.expandSheet()
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
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
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

	/// At the middle stop the sheet offers its categories as a grid, as Maps
	/// does for a shopping centre, and a group opens its places under a
	/// header naming it.
	func testTheGridOpensAGroupAndGoesBack() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.capture("St. Olaf map category grid")
			.openCategory(TestIdentifiers.Map.diningCategory)
			.capture("St. Olaf map Dining group")
			.verifyGroupOpen(TestIdentifiers.Map.diningCategory)
			.capture("St. Olaf map Dining pins")
			.goBackToCategories()
	}

	/// Search runs over every place, whichever group is open.
	func testSearchFromAGroupFindsPlacesOutsideIt() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.diningCategory)
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aPlaceOutsideDining)
			.selectBuilding(named: TestIdentifiers.Map.aPlaceOutsideDining)
			.verifyTopCard(TestIdentifiers.Map.aPlaceOutsideDining)
	}

	/// At the largest text size a group's title wraps or shrinks beside its
	/// back button rather than drawing under it.
	func testAGroupTitleClearsItsBackButtonAtTheLargestTextSize() throws {
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.allBuildingsCategory)
			.capture("St. Olaf map All Buildings group at the largest text size")
			.verifyGroupTitleClearsBackButton(TestIdentifiers.Map.allBuildingsCategory)
	}

	/// At the largest text size the categories are a list: a grid narrow
	/// enough to fit would leave each label a word or two a line.
	func testTheCategoriesAreAListAtTheLargestTextSize() throws {
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.capture("St. Olaf map categories at the largest text size")
			// The first row: at this size the sheet may rest short of its full
			// stop, and a list builds only the rows it shows.
			.verifyCategoriesAsList(including: TestIdentifiers.Map.allBuildingsCategory)
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

	/// Close ends a search in one tap after the keyboard's Search key has
	/// already ended editing, as Apple Maps' X does -- rather than putting the
	/// field back into editing and needing a second tap.
	func testOneTapOnCloseEndsASubmittedSearch() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aPointOnlyPlace)
			.submitSearch()
			.verifyAtMiddleStop()
			.verifyKeyboardHidden()
			.capture("St. Olaf map after submitting a search")
			.cancelSearch()
			.capture("St. Olaf map after one tap on Close")
			.verifyKeyboardHidden()
			.verifySearchFieldEmpty()
	}

	/// The Parking group's pins, for a person to look at: its many places merge
	/// into numbered clusters.
	func testTheParkingGroupClustersItsPins() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.parkingCategory)
			.capture("St. Olaf map Parking clusters")
	}

	/// The base map's own name for a place inside a building opens that place,
	/// not the building around it. Searching frames the place's pin at a known
	/// spot; cancelling takes the pin away and leaves the camera, so the base
	/// map's label for the place is what is under that spot.
	func testATappedPlaceNameOpensItsOwnCard() throws {
		let name = TestIdentifiers.Map.aPointOnlyPlace
		let screen = MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.focusSearch()
			.typeIntoSearch(name)
			.submitSearch()
			.verifyAtMiddleStop()
		let spot = screen.mapCenterAboveSheet()
		screen
			.cancelSearch()
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

	/// A trail opens from Outdoors, and the map draws its whole course, for a
	/// person to look at.
	func testATrailOpensFromOutdoors() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.outdoorsCategory)
			.selectBuilding(named: TestIdentifiers.Map.aTrail)
			.verifyTopCard(TestIdentifiers.Map.aTrail)
			.capture("St. Olaf map with a trail open")
	}

	/// Outdoors lists the Natural Lands' ponds as well as its trails.
	func testOutdoorsListsAPond() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.outdoorsCategory)
			.selectBuilding(named: TestIdentifiers.Map.aPond)
			.verifyTopCard(TestIdentifiers.Map.aPond)
	}

	/// Wellness Walks lists the walks, and a walk's card gives its time and guide.
	func testAWalkOpensFromWellnessWalks() throws {
		MapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.wellnessWalksCategory)
			.selectBuilding(named: TestIdentifiers.Map.aWalk)
			.verifyTopCard(TestIdentifiers.Map.aWalk)
			.expandSheet()
			.capture("St. Olaf map Wellness Walk card")
			.verifyCardShows("14–17 min walk")
			.verifyCardShows("Wellness Walk guide")
	}
}
