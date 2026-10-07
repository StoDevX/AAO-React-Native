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
	/// Last, like Maps, the map runs under a clear header.
	func testTheCollapsedSheetRisesForSearchAndForAFootprint() throws {
		let screen = MapScreen(app: app)
			.navigate()
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyCollapsedMarginsSymmetric()
			.verifyAttributionClearOfSheet()
		let collapsedTop = screen.searchFieldTop()

		screen
			.focusSearch()
			.verifySheetMoved(from: collapsedTop, .up, "Focusing search should raise the sheet to large")
			.cancelSearch()
			.verifySheetReturned(to: collapsedTop)
			.verifyCollapsed()
			.tapAFootprint()
			.verifyCardAtMedium()
		let region = screen.mapAboveSheet()
		let before = screen.settledMap(in: region)

		screen
			.collapseCard()
			.verifyCardCollapsed()
			.verifyMapHeldStill(since: before, in: region)
			.verifyClearHeader()
	}

	/// At the largest text size the search field grows to fit its text, and the collapsed stop grows
	/// with it, as Apple Maps' does: the whole field stays inside the sheet with
	/// a margin above and below it.
	///
	/// A group's title then wraps or shrinks beside its back button rather
	/// than drawing under it.
	func testTheCollapsedSheetHoldsTheSearchFieldAtTheLargestTextSize() throws {
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MapScreen(app: app)
			.navigate()
			.verifyCollapsed()
			.verifyFieldWithinSheet()
			.verifyFieldHasMarginsInSheet()
			.expandSheet()
			.openCategory(TestIdentifiers.Map.buildingsCategory)
			.verifyGroupTitleClearsBackButton(TestIdentifiers.Map.buildingsCategory)
	}

	/// The full sheet, and a row tapped from it.
	///
	/// The module pins the field at 44pt with a constraint UIKit is free to
	/// overrule silently, so the height is checked before anything else moves
	/// the sheet.
	///
	/// The grid's bottom-left tile draws its whole name. The grid is a row of
	/// the sheet's list, and the list clips each row to its card's rounded
	/// corners, which once cut the foot off that tile's first letter.
	///
	/// `aBuilding` is absent from Carleton's map, so this also fails if `/map`
	/// ignored its `campus`, which falls back to Carleton.
	func testTheFullSheetDropsToMediumForARow() throws {
		let screen = MapScreen(app: app)
			.navigate()
			.expandSheet()
			.verifySearchFieldHeight()
			.verifyTileNameDrawnWhole(TestIdentifiers.Map.cornerCategory)
			.openCategory(TestIdentifiers.Map.buildingsCategory)
			// Opening a group drops the sheet to make room for its pins.
			.expandSheet()
		let largeTop = screen.searchFieldTop()

		screen
			.selectBuilding(named: TestIdentifiers.Map.aBuilding)
			.verifyCardDroppedFrom(largeTop)
			.verifyCardAtMedium()
	}

	/// Issue #7962: the collapsed card cut off the bottom of the building's
	/// name. A long name with a subtitle under it, because that is the most the
	/// collapsed header has to hold, and a short one fits whatever it does.
	func testTheCollapsedCardHoldsItsWholeHeader() throws {
		MapScreen(app: app)
			.navigate()
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aSubtitledBuilding)
			.selectBuilding(named: TestIdentifiers.Map.aSubtitledBuilding)
			.collapseCard()
			.verifyCardCollapsed()
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
			.focusSearch()
			.typeIntoSearch(TestIdentifiers.Map.aSubtitledBuilding)
			.selectBuilding(named: TestIdentifiers.Map.aSubtitledBuilding)
			.collapseCard()
			.verifyCardCollapsed()
			.verifyCardHeaderTopWithinSheet()
	}

	/// Once expanded, a card's About text can be selected and copied. Cut
	/// short, it cannot: a copy then would hold only the lines on screen.
	func testAnExpandedAboutCanBeCopied() throws {
		let name = TestIdentifiers.Map.aBuildingWithALongAbout
		MapScreen(app: app)
			.navigate()
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
			.expandSheet()
			.openCategory(category)
			// Parking's many places merge into numbered clusters.
		let offset = screen.scrollListToReach(name)
		screen
			.selectBuilding(named: name)
			.closeTopCard()
			.verifyListKeptItsPlace(category: category, row: name, offset: offset)
	}

	/// A place's card lists what else is there, and each opens its own card in
	/// a sheet over it, as Maps stacks place sheets; the point's card shows
	/// its own venue's hours. Closing it shows the card beneath again.
	///
	/// Whether a map tap over stacked cards starts afresh is not checked here:
	/// a presented sheet leaves the ones beneath it out of the accessibility
	/// tree, so a stack and a single card read the same.
	func testATileOpensItsCardOverTheCardBeneath() throws {
		let name = TestIdentifiers.Map.aBuildingWithPoints
		let point = TestIdentifiers.Map.aPointInside
		MapScreen(app: app)
			.navigate()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.openPlaceTile(named: point)
			.verifyTopCard(point)
			.verifyHoursStatus()
			.closeTopCard()
			.verifyTopCard(name)
	}

	/// A building's Directory lists its floors; a floor stacks its sheet over
	/// the card, and a place on it stacks its own card over the floor.
	func testAFloorOpensWhatIsOnIt() throws {
		let name = TestIdentifiers.Map.aBuildingWithADirectory
		MapScreen(app: app)
			.navigate()
			.focusSearch()
			.typeIntoSearch(name)
			.selectBuilding(named: name)
			.expandCard()
			.openDirectoryFloor(TestIdentifiers.Map.aDirectoryFloorIndex)
			.verifyTopCard(TestIdentifiers.Map.aDirectoryFloor)
			.verifyFloorSheetOnTop()
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
	///
	/// The cancel is also the check that Close ends a search in one tap after
	/// the keyboard's Search key has already ended editing, as Apple Maps' X
	/// does -- rather than putting the field back into editing and needing a
	/// second tap.
	func testASearchedPinOpensItsOwnCard() throws {
		let name = TestIdentifiers.Map.aPointOnlyPlace
		MapScreen(app: app)
			.navigate()
			.focusSearch()
			.typeIntoSearch(name)
			.submitSearch()
			.verifyAtMiddleStop()
			.verifyKeyboardHidden()
			.tapMapCenterAboveSheet()
			.verifyCardTitled(name)
			.closeTopCard()
			.cancelSearch()
			.verifyKeyboardHidden()
			.verifySearchFieldEmpty()
	}
}
