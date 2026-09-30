import XCTest

struct MapScreen: Screen {
	let app: XCUIApplication

	/// The picker sheet's search field: a UISearchBar's text field, which is
	/// the sheet's only content at the collapsed detent it opens at.
	private var searchField: XCUIElement {
		app.searchFields[TestIdentifiers.Map.search].firstMatch
	}

	/// The box the sheet actually draws, which is what its content is clipped
	/// to. `app.sheets` is empty for this presentation: UIKit exposes the sheet
	/// as an `otherElement` holding the grabber button, and the window-sized
	/// host holds that button too, so the shortest of the elements holding it
	/// is the sheet.
	///
	/// Descendants rather than frames decide this. The grabber's own frame is
	/// padded out for hit testing and reaches above the sheet's top edge, so
	/// asking which frames contain it finds the sheet nowhere.
	///
	/// Fails rather than falling back to the window if nothing answers. A box
	/// the whole screen tall contains anything, so a fallback would turn
	/// `verifyFieldWithinSheet` green on a query that had stopped working.
	private func sheetFrame() -> CGRect {
		let window = app.windows.firstMatch.frame
		let candidates = app.otherElements
			.containing(NSPredicate(format: "label == %@", TestIdentifiers.Map.sheetGrabber))
			.allElementsBoundByIndex
			.map(\.frame)
			.filter { $0.height < window.height }
		guard let sheet = candidates.min(by: { $0.height < $1.height }) else {
			XCTFail(
				"The presented sheet's own box should be findable as the shortest element "
					+ "holding the \(TestIdentifiers.Map.sheetGrabber)")
			return .null
		}
		return sheet
	}

	/// Scoped to the search bar rather than the whole screen: the building
	/// card's own dismiss button carries the same label, so an unscoped query
	/// could answer for either.
	private var cancelButton: XCUIElement {
		app.otherElements[TestIdentifiers.Map.search]
			.buttons[TestIdentifiers.Map.cancel].firstMatch
	}

	/// Its own `testID` rather than a label query: the search bar's Cancel
	/// carries the same "Close" label, and the picker is still mounted while
	/// this is waited on, so a label-only query could be satisfied by the
	/// wrong element.
	private var closeButton: XCUIElement {
		app.buttons[TestIdentifiers.Map.cardCloseButton].firstMatch
	}

	/// The card's title block. One accessibility element of no fixed type,
	/// so it is found by identifier alone.
	private var cardTitle: XCUIElement {
		app.descendants(matching: .any)[TestIdentifiers.Map.cardTitle].firstMatch
	}

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		searchField
	}

	/// St. Olaf's map is a home tile of its own, pushing `/Map?campus=stolaf`.
	@discardableResult
	func navigate() -> Self {
		// The sheet, not the map: MapLibre draws nothing XCUITest can see.
		open(route: "/Map?campus=stolaf", mountedWhen: mounted, timeout: 60)
	}

	/// The map draws through MapLibre, which XCUITest cannot see into, so the
	/// sheet over it is what tells us the screen came up.
	@discardableResult
	func checkSheetPresented() -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 60),
			"The map should present its building sheet")
		return self
	}

	/// Where the field's top edge sits on screen. Only a detent change moves
	/// it: it is pinned above the list, so a scroll never does.
	func searchFieldTop() -> CGFloat {
		searchField.frame.minY
	}

	/// Apple Maps' field is 44pt. The bar pins the height at priority 999 so
	/// UIKit's own layout of the text field wins any conflict, which means a
	/// conflict comes out as a quietly short field rather than a console
	/// warning. Measuring is the only thing that would notice.
	///
	/// Measured at a full-width stop. UIKit applies a detent-dependent shrink to
	/// any presented sheet's content -- Apple Maps' own small-detent drop shadow
	/// carries the same 0.8607 scale -- so a frame read at a smaller detent is
	/// smaller than the layout that produced it, and 44pt would be the wrong
	/// number to expect there. See "Sizing the collapsed detent" in
	/// `docs/superpowers/specs/2026-09-07-map-sheet-search-bar-design.md`.
	@discardableResult
	func verifySearchFieldHeight() -> Self {
		let height = searchField.frame.height
		XCTContext.runActivity(named: "The search field measures \(height)pt tall") { _ in }
		XCTAssertEqual(
			height, 44, accuracy: 1,
			"The search field should be Apple Maps' 44pt, not \(height)")
		return self
	}

	/// Drags the sheet from its collapsed detent up to full height, where the
	/// building list is.
	@discardableResult
	func expandSheet() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.93))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(
					withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)))
		return self
	}

	@discardableResult
	func focusSearch() -> Self {
		searchField.tap()
		XCTAssertTrue(
			cancelButton.waitForExistence(timeout: 10),
			"Focusing the search field should show its cancel button, which iOS labels Close")
		return self
	}

	@discardableResult
	func cancelSearch() -> Self {
		cancelButton.tap()
		XCTAssertTrue(
			cancelButton.waitForNonExistence(timeout: 10),
			"Cancel should hide itself once there is nothing to cancel")
		return self
	}

	/// Types into the focused field one character at a time, the way a person
	/// does, and reads the whole string back. The bar reports each keystroke to
	/// JavaScript and takes the echo back as a prop, so a character lost to
	/// that round trip would show up here and nowhere else.
	@discardableResult
	func typeIntoSearch(_ text: String) -> Self {
		searchField.typeText(text)
		let arrived = searchField.value as? String
		XCTAssertEqual(
			arrived, text,
			"Every character typed should survive the round trip to JavaScript")
		return self
	}

	/// A building's row in the sheet's list: the name alone, or the name and
	/// then its abbreviation -- a building carrying one reads as "Buntrock
	/// Commons, BC". Not any label beginning with the name, which would take
	/// Baseball Pond Loop's row for Baseball Pond's.
	private func row(named name: String) -> XCUIElement {
		app.buttons.matching(
			NSPredicate(format: "label == %@ OR label BEGINSWITH %@", name, "\(name), ")
		).firstMatch
	}

	/// The collapsed stop rests at the foot of the screen with the field on it,
	/// which is what tells it apart from medium and large. The line is drawn at
	/// 70% of the screen, between the two: the middle stop puts the field near
	/// 60%, and the collapsed stop, grown to hold the field at the largest text
	/// size, near 80% on a 17e.
	///
	/// How much of the field the stop shows is `verifyFieldWithinSheet`'s
	/// question, not this one: `isHittable` answers true for content the sheet
	/// clips away, so it measures reachability rather than what is drawn.
	@discardableResult
	func verifyCollapsed() -> Self {
		XCTAssertTrue(searchField.isHittable, "The search field should be reachable while collapsed")
		let top = searchFieldTop()
		let windowHeight = app.windows.firstMatch.frame.height
		XCTAssertTrue(
			top > windowHeight * 0.7,
			"The collapsed sheet should rest at the foot of the screen; the field's top is at \(top) of \(windowHeight)")
		XCTAssertFalse(cancelButton.exists, "An empty, unfocused field has nothing to cancel")
		return self
	}

	/// UIKit shrinks a presented sheet by a detent-dependent scale, so the
	/// design's layout content lands on screen smaller than it was laid out.
	/// The field's own frame is what the scale and the margins around it come
	/// back as, once that shrink has already happened.
	///
	/// **This cannot see the field being clipped**, because XCUITest reports an
	/// element's frame whether or not an ancestor cuts it off: a stop too short
	/// to hold the field leaves the margins around it symmetric and this
	/// assertion green. `verifyFieldWithinSheet` is the one that catches that,
	/// and the two belong together.
	@discardableResult
	func verifyCollapsedMarginsSymmetric() -> Self {
		let field = searchField.frame
		let window = app.windows.firstMatch.frame
		let scale = field.height / 44
		// The floating sheet's inset comes from the shrink alone -- a scaled
		// box centred in the window leaves (1 - scale) of the width split
		// evenly on both sides -- not from wherever the field itself sits.
		// `UISearchBar` insets its own text field further in than Maps' field
		// sits, so deriving the inset from the field's x would fold that extra
		// margin into "inset" and hide it there instead of in bottomMargin.
		let inset = window.width * (1 - scale) / 2
		let sheetBottom = window.height - inset
		let bottomMargin = sheetBottom - (field.origin.y + field.height)
		let topMargin = 16 * scale
		XCTContext.runActivity(
			named: "scale \(scale), inset \(inset), sheetBottom \(sheetBottom), "
				+ "topMargin \(topMargin), bottomMargin \(bottomMargin)"
		) { _ in }
		XCTAssertEqual(
			bottomMargin, topMargin, accuracy: 1,
			"The collapsed sheet should leave the same margin below the field as "
				+ "above it: top \(topMargin), bottom \(bottomMargin)")
		return self
	}

	/// The stop has to *hold* the field, not merely position it well. A `VStack`
	/// taller than the stop it is presented in is centred in it rather than
	/// clipped at the bottom, so a stop that cannot fit the picker's header
	/// block slices the field's top edge off -- which
	/// `verifyCollapsedMarginsSymmetric` reads as symmetric and passes.
	///
	/// Measured against the sheet's own box rather than the window's: the sheet
	/// floats clear of the screen's edges, so the window would call a field
	/// hanging off the sheet contained.
	@discardableResult
	func verifyFieldWithinSheet() -> Self {
		let field = searchField.frame
		let sheet = sheetFrame()
		XCTContext.runActivity(named: "field \(field) in sheet \(sheet)") { _ in }
		XCTAssertTrue(
			field.minY >= sheet.minY && field.maxY <= sheet.maxY,
			"The collapsed sheet should hold the whole search field, not clip it: "
				+ "field \(field), sheet \(sheet)")
		return self
	}

	/// The field sits in the sheet with room above and below it, as Maps'
	/// does at every text size, rather than touching or crossing the sheet's
	/// edges. `verifyCollapsedMarginsSymmetric` checks the exact margins at the
	/// default size; this one holds at any size, where the field's height is
	/// not known in advance.
	@discardableResult
	func verifyFieldHasMarginsInSheet() -> Self {
		let field = searchField.frame
		let sheet = sheetFrame()
		let above = field.minY - sheet.minY
		let below = sheet.maxY - field.maxY
		XCTContext.runActivity(named: "\(above)pt above the field, \(below)pt below it") { _ in }
		XCTAssertGreaterThanOrEqual(above, 8, "The field should sit clear of the sheet's top: \(above)pt")
		XCTAssertGreaterThanOrEqual(below, 8, "The field should sit clear of the sheet's bottom: \(below)pt")
		return self
	}

	/// The attribution button sits over the map, and the collapsed sheet
	/// floats over the bottom of it, so the two have to be kept apart: the
	/// button's whole frame above the sheet's top edge, and still tappable.
	@discardableResult
	func verifyAttributionClearOfSheet() -> Self {
		let button = app.buttons[TestIdentifiers.Map.attribution].firstMatch
		XCTAssertTrue(
			button.waitForExistence(timeout: 30) && button.isHittable,
			"The map's attribution button should be on screen and tappable")
		let sheet = sheetFrame()
		XCTContext.runActivity(named: "attribution \(button.frame) sheet \(sheet)") { _ in }
		XCTAssertTrue(
			button.frame.maxY < sheet.minY,
			"The attribution button should sit clear of the sheet, not under it: "
				+ "button \(button.frame), sheet \(sheet)")
		return self
	}

	/// A place tile on the card, found by its name, which begins its label;
	/// the card is scrolled a screen at a time until the tile can be tapped.
	@discardableResult
	func openPlaceTile(named name: String) -> Self {
		let tile = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
		scrollCard(toReach: tile)
		XCTAssertTrue(tile.waitForExistence(timeout: 10) && tile.isHittable, "The card should list \(name)")
		tile.tap()
		return self
	}

	/// Scrolls the card a screen at a time until `element` can be tapped. The
	/// card's list builds only the rows near the screen, so a section further
	/// down is not there to find until the card reaches it -- and how far down
	/// that is depends on the screen and on what the live feed puts above it.
	private func scrollCard(toReach element: XCUIElement) {
		for _ in 0..<6 where !(element.exists && element.isHittable) {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
				.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)))
		}
	}

	/// Opens a floor of the card's Directory, scrolling the card to it first.
	@discardableResult
	func openDirectoryFloor(_ index: Int) -> Self {
		let row = app.buttons[TestIdentifiers.Map.directoryFloor(index)].firstMatch
		scrollCard(toReach: row)
		XCTAssertTrue(row.exists && row.isHittable, "The card's Directory should list floor \(index)")
		row.tap()
		return self
	}

	/// The top sheet is a floor's: one of its entry rows can be tapped. Only a
	/// floor sheet has them, and the Directory's own row on the card beneath
	/// shares the floor's name, so the name alone cannot tell them apart.
	@discardableResult
	func verifyFloorSheetOnTop() -> Self {
		let entries = app.buttons.matching(identifier: TestIdentifiers.Map.directoryEntry)
		XCTAssertTrue(entries.firstMatch.waitForExistence(timeout: 10), "A floor's sheet should be up")
		XCTAssertTrue(
			entries.allElementsBoundByIndex.contains { $0.isHittable },
			"The floor's sheet should be on top")
		return self
	}

	/// Opens an entry on the floor sheet on top. Matched by the entry
	/// identifier as well as its name: the card beneath can list a tile of the
	/// same name, covered but still in the tree.
	@discardableResult
	func openDirectoryEntry(named name: String) -> Self {
		let row = app.buttons
			.matching(NSPredicate(
				format: "identifier == %@ AND label BEGINSWITH %@", TestIdentifiers.Map.directoryEntry, name))
			.firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 10) && row.isHittable, "The floor should list \(name)")
		row.tap()
		return self
	}

	/// The top card is `name`'s: only one card's close button can be tapped,
	/// and `name` can be seen, as the header's title or, at the large stop,
	/// the big title in its place. A title's label carries its subtitle after
	/// the name, so it is matched by its start.
	@discardableResult
	func verifyTopCard(_ name: String) -> Self {
		let named = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label BEGINSWITH %@", name))
		XCTAssertTrue(named.firstMatch.waitForExistence(timeout: 20), "\(name)'s card should be up")
		let visible = named.allElementsBoundByIndex.filter { $0.isHittable }
		let closes = app.buttons.matching(identifier: TestIdentifiers.Map.cardCloseButton)
			.allElementsBoundByIndex.filter { $0.isHittable }
		XCTContext.runActivity(named: "\(visible.count) visible \(name), \(closes.count) close buttons") { _ in }
		XCTAssertFalse(visible.isEmpty, "\(name)'s card should be in view")
		XCTAssertEqual(closes.count, 1, "Only the top card's close button should be tappable")
		return self
	}

	/// `name`'s card is back as the only card, and closing it by a tap where
	/// its close button is drawn returns to the search sheet.
	///
	/// Checked by touch rather than by `isHittable`: after two stacked sheets
	/// close in quick succession, the accessibility tree has shown an empty
	/// second window above the card and the card's close button as not
	/// hittable, while a tap at the button still closed the card. Whether
	/// VoiceOver can reach the card then is unchecked.
	@discardableResult
	func verifyBaseCardAnswersTouch(_ name: String) -> Self {
		let title = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 20), "\(name)'s card should be back")
		// The sheets above may still be leaving; their close buttons go with them.
		let query = app.buttons.matching(identifier: TestIdentifiers.Map.cardCloseButton)
		let deadline = Date().addingTimeInterval(5)
		while query.count != 1 && Date() < deadline {
			Thread.sleep(forTimeInterval: 0.25)
		}
		let closes = query.allElementsBoundByIndex
		XCTAssertEqual(closes.count, 1, "Only \(name)'s card should be left")
		guard let close = closes.first else { return self }
		app.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: close.frame.midX, dy: close.frame.midY))
			.tap()
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 10),
			"Tapping \(name)'s close button should close the card")
		return self
	}

	/// Closes the top card, which returns to the card beneath it.
	@discardableResult
	func closeTopCard() -> Self {
		let closes = app.buttons.matching(identifier: TestIdentifiers.Map.cardCloseButton)
			.allElementsBoundByIndex.filter { $0.isHittable }
		XCTAssertEqual(closes.count, 1, "Only the top card's close button should be tappable")
		closes.first?.tap()
		return self
	}

	/// The map runs under a clear header: no title drawn, and the About menu
	/// there opens the map's credits.
	@discardableResult
	func verifyClearHeaderWithCredits() -> Self {
		XCTAssertFalse(
			app.navigationBars.staticTexts[TestIdentifiers.Map.stolafTitle].exists,
			"The map's header should draw no title")
		let about = app.buttons[TestIdentifiers.Map.attribution].firstMatch
		XCTAssertTrue(about.waitForExistence(timeout: 30), "The header should offer the map's credits")
		about.tap()
		let credit = app.buttons[TestIdentifiers.Map.osmCredit].firstMatch
		XCTAssertTrue(
			credit.waitForExistence(timeout: 10),
			"The About menu should credit OpenStreetMap, as the tiles' licence requires")
		capture("The map's About menu")
		return self
	}

	/// A move is a change of at least a hundred points: the collapsed stop
	/// renders at about 65pt, the middle stop at `MAP_MIDDLE_FRACTION` of
	/// the screen, and large at nearly all of it, so anything smaller is a
	/// scroll or a wobble, not a detent change.
	@discardableResult
	func verifySheetMoved(from before: CGFloat, direction: String, _ message: String) -> Self {
		let after = searchFieldTop()
		let moved = direction == "up" ? before - after : after - before
		XCTAssertTrue(
			moved > 100,
			"\(message): the field's top went from \(before) to \(after)")
		return self
	}

	@discardableResult
	func verifySheetReturned(to before: CGFloat) -> Self {
		let after = searchFieldTop()
		XCTAssertTrue(
			abs(after - before) < 2,
			"Cancel should put the sheet back where it was, at \(before), not \(after)")
		return self
	}

	/// Taps a named row rather than the first button on screen, which is the
	/// navigation bar's rather than the list's.
	///
	/// Retried: a synthesized press
	/// on a row whose host has mounted but whose action still has to reach
	/// JavaScript lands natively and does nothing. Waiting longer does not
	/// help a dropped tap; tapping again does.
	@discardableResult
	func selectBuilding(named name: String) -> Self {
		let row = self.row(named: name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"The expanded sheet should list \(name)")

		for attempt in 1...3 {
			// The row's centre on purpose. It falls on the Spacer between the
			// name and the chevron, which is outside what a SwiftUI button's
			// label draws -- the row carries a contentShape so the whole of it
			// responds, and tapping over the name would pass either way.
			row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
			if closeButton.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(attempt) on \(name) did not open its card; retrying"
			) { _ in }
		}

		XCTFail("Tapping \(name) never opened its card")
		return self
	}

	/// Presses the keyboard's Search key, which ends the search.
	@discardableResult
	func submitSearch() -> Self {
		searchField.typeText("\n")
		return self
	}

	/// The sheet rests at its middle stop: the field between the full stop,
	/// near the top of the screen, and the collapsed one, past 70% of it. The
	/// middle stop puts it near 60%.
	@discardableResult
	func verifyAtMiddleStop() -> Self {
		settle { searchFieldTop() }
		let top = searchFieldTop()
		let windowHeight = app.windows.firstMatch.frame.height
		XCTAssertTrue(
			top > windowHeight * 0.4 && top < windowHeight * 0.7,
			"The sheet should rest at its middle stop; the field's top is at \(top) of \(windowHeight)")
		return self
	}

	/// Taps the middle of the map above the sheet, where a single framed pin
	/// is eased to.
	@discardableResult
	func tapMapCenterAboveSheet() -> Self {
		mapCenterAboveSheet().tap()
		return self
	}

	/// The middle of the map above the sheet as it rests now: where a single
	/// framed pin is eased to.
	func mapCenterAboveSheet() -> XCUICoordinate {
		settle { sheetFrame().minY }
		let sheet = sheetFrame()
		return app.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: app.frame.midX, dy: sheet.minY / 2))
	}

	/// Taps a spot on the map found earlier, which stays put while the sheet
	/// moves, since the camera does not follow the sheet.
	@discardableResult
	func tapMap(at spot: XCUICoordinate) -> Self {
		spot.tap()
		return self
	}

	/// The card on top is `name`'s own, read from its title rather than any
	/// label beginning with the name: a building's card lists what is inside
	/// it, so `name` can be on screen in someone else's card.
	@discardableResult
	func verifyCardTitled(_ name: String) -> Self {
		XCTAssertTrue(cardTitle.waitForExistence(timeout: 20), "A card should be up")
		XCTAssertTrue(
			cardTitle.label.hasPrefix(name),
			"The card on top should be \(name)'s, not \(cardTitle.label)")
		return self
	}

	/// Opens a group from the sheet's categories: a tile in the grid, or a
	/// row once the text size turns the grid into a list.
	@discardableResult
	func openCategory(_ label: String) -> Self {
		let tile = app.buttons[label].firstMatch
		XCTAssertTrue(tile.waitForExistence(timeout: 30), "The sheet should offer \(label)")
		tile.tap()
		XCTAssertTrue(
			groupBackButton.waitForExistence(timeout: 10),
			"Opening \(label) should show its header's back button")
		return self
	}

	/// A tile's name is drawn down to its first letter's lower edge: there is
	/// ink in the leftmost tenth of the name's lower half. The name's frame
	/// fits its tile either way, so only the pixels can tell a clipped letter.
	@discardableResult
	func verifyTileNameDrawnWhole(_ label: String) -> Self {
		let name = app.staticTexts[label].firstMatch
		XCTAssertTrue(name.waitForExistence(timeout: 10), "The grid should show \(label)")
		settle { name.frame.minY }
		let frame = name.frame
		guard let pixels = ScreenPixels(app.screenshot().image) else {
			XCTFail("The screenshot should be readable as pixels")
			return self
		}
		let corner = CGRect(
			x: frame.minX, y: frame.midY, width: frame.width / 10, height: frame.height / 2)
		var inked = 0
		for y in stride(from: corner.minY, to: corner.maxY, by: 0.5) {
			for x in stride(from: corner.minX, to: corner.maxX, by: 0.5) {
				let colour = pixels.colour(at: CGPoint(x: x, y: y))
				if colour.red + colour.green + colour.blue < 300 {
					inked += 1
				}
			}
		}
		XCTAssertGreaterThan(
			inked, 0,
			"\(label)'s first letter should be drawn whole, but its lower-left corner is blank")
		return self
	}

	private var groupBackButton: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.Map.groupBack).firstMatch
	}

	/// The open group's header names it.
	@discardableResult
	func verifyGroupOpen(_ label: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[label].waitForExistence(timeout: 10),
			"The header should read \(label)")
		XCTAssertTrue(groupBackButton.exists, "\(label)'s header should have a back button")
		return self
	}

	/// At large text sizes the categories are rows rather than a grid.
	@discardableResult
	func verifyCategoriesAsList(including label: String) -> Self {
		XCTAssertTrue(
			app.buttons[label].firstMatch.waitForExistence(timeout: 30),
			"The sheet should list \(label)")
		XCTAssertFalse(
			app.otherElements[TestIdentifiers.Map.categoryGrid].exists,
			"At this text size the categories should be a list, not a grid")
		return self
	}

	/// Recents lists `name` below the categories.
	@discardableResult
	func verifyRecentsList(_ name: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Map.recentsTitle].waitForExistence(timeout: 10),
			"The sheet should show Recents once a place has been opened")
		XCTAssertTrue(row(named: name).waitForExistence(timeout: 10), "Recents should list \(name)")
		return self
	}

	/// Swipes `name`'s row in Recents away.
	@discardableResult
	func removeRecent(_ name: String) -> Self {
		row(named: name).swipeLeft()
		let remove = app.buttons[TestIdentifiers.Map.recentsRemove].firstMatch
		// A full swipe removes the row by itself; a shorter one leaves the
		// button to tap.
		if remove.waitForExistence(timeout: 3) {
			remove.tap()
		}
		return self
	}

	/// With nothing left in it, Recents is gone.
	@discardableResult
	func verifyNoRecents() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Map.recentsTitle].waitForNonExistence(timeout: 10),
			"Recents should go once its last place is removed")
		return self
	}

	/// Leaves the open group for the grid.
	@discardableResult
	func goBackToCategories() -> Self {
		groupBackButton.tap()
		XCTAssertTrue(
			app.otherElements[TestIdentifiers.Map.categoryGrid].waitForExistence(timeout: 10),
			"Back should return to the category grid")
		XCTAssertFalse(groupBackButton.exists, "The group's header should be gone after Back")
		return self
	}

	/// The open group's title sits clear of its back button, whatever its
	/// length or the text size.
	@discardableResult
	func verifyGroupTitleClearsBackButton(_ label: String) -> Self {
		let title = app.staticTexts[label].firstMatch
		XCTAssertTrue(title.waitForExistence(timeout: 10), "The header should read \(label)")
		XCTAssertFalse(
			title.frame.intersects(groupBackButton.frame),
			"\(label) (\(title.frame)) should not run under the back button (\(groupBackButton.frame))")
		return self
	}

	/// Scrolls the sheet's list until `name`'s row sits a row or two under the header,
	/// and returns how far below the search field its top is. The field does
	/// not scroll, so this distance is the list's scroll position as a row
	/// sees it. Near the header, the row stays in view at the middle stop too.
	func scrollListToReach(_ name: String) -> CGFloat {
		let row = self.row(named: name)
		var drags = 0
		// Into the upper part of the screen, clear of the bottom edge, where a
		// drag that starts on the row reliably takes.
		let upper = app.frame.height * 0.6
		// Each drag is slow and held, so the list stops where the drag ends. A
		// quick one flings it, and the check below then reads a row that is still
		// moving -- one that looks in range can coast on under the header.
		for _ in 0..<12 where !(row.exists && row.isHittable && row.frame.minY < upper) {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
				.press(
					forDuration: 0.05,
					thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)),
					withVelocity: .slow, thenHoldForDuration: 0.5)
			drags += 1
		}
		XCTAssertTrue(row.exists && row.isHittable, "Scrolling should reach \(name)")
		// A row already on screen would leave nothing for a later check of the
		// scroll position to catch.
		XCTAssertGreaterThan(drags, 1, "\(name) should be more than a screen down the list")
		// Slowly, and held at the end, so the list does not coast past. Only
		// when the row is well below the header, though: a drag of a few points
		// barely clears the scroll view's touch slop, and one in eight on the
		// simulator flung the list well over a hundred points, carrying the row
		// up under the header and out of the accessibility tree.
		let underHeader = searchField.frame.minY + 150
		if row.frame.minY - underHeader > 100 {
			row.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0))
				.press(
					forDuration: 0.05,
					thenDragTo: searchField.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0))
						.withOffset(CGVector(dx: 0, dy: 150)),
					withVelocity: .slow, thenHoldForDuration: 0.5)
		}
		settle { row.exists ? row.frame.minY : -1 }
		XCTAssertTrue(row.exists && row.isHittable, "\(name) should still be on screen once the list stops")
		return row.frame.minY - searchField.frame.minY
	}

	/// Waits until `position` stops moving.
	private func settle(_ position: () -> CGFloat) {
		var previous = position()
		for _ in 1...10 {
			Thread.sleep(forTimeInterval: 0.3)
			let now = position()
			if abs(now - previous) < 0.5 { break }
			previous = now
		}
	}

	/// The list came back as it was left: `category` still picked, and
	/// `name`'s row the same distance below the search field.
	@discardableResult
	func verifyListKeptItsPlace(category: String, row name: String, offset: CGFloat) -> Self {
		settle { searchField.frame.minY }
		capture("The list after closing the card")
		XCTAssertTrue(
			app.staticTexts[category].exists && groupBackButton.exists,
			"\(category) should still be open after closing a card")
		let row = self.row(named: name)
		XCTAssertTrue(row.waitForExistence(timeout: 10), "\(name) should still be listed")
		let now = row.frame.minY - searchField.frame.minY
		// The list shifts a few points as the sheet changes stop. A list that lost
		// its place would put this row two screens away, not twenty points.
		XCTAssertEqual(now, offset, accuracy: 20, "The list should keep its scroll position after closing a card")
		return self
	}

	/// The map view. MapLibre publishes a single element for the whole map and
	/// nothing per building -- a hierarchy dump from a failing run shows one
	/// `Other` labelled "Map", valued `Zoom 16x.`, and no footprints -- so a
	/// test cannot ask for a building. It can ask where the map is.
	private var mapView: XCUIElement {
		app.otherElements[TestIdentifiers.Map.map].firstMatch
	}

	/// Points within the map's own bounds, tried in turn until one lands on a
	/// building.
	///
	/// Normalised against the map rather than the screen, so they mean what
	/// they say: the map occupies the space between the navigation bar and the
	/// collapsed sheet, and a screen-relative offset moves off it whenever
	/// either changes height.
	///
	/// The map's centre is not enough on its own, because it is not always a
	/// building: what lies there depends on the campus's starting camera and
	/// the device's screen, and a road between two footprints takes no tap.
	/// Which building answers does not matter -- the test is about what a
	/// footprint tap does to the sheet -- but some building has to.
	private static let footprintProbes: [CGVector] = [
		CGVector(dx: 0.50, dy: 0.45),
		CGVector(dx: 0.30, dy: 0.52),
		CGVector(dx: 0.70, dy: 0.48),
		CGVector(dx: 0.45, dy: 0.62),
		CGVector(dx: 0.62, dy: 0.67),
		CGVector(dx: 0.28, dy: 0.70),
	]

	/// Taps the map until a building card opens.
	///
	/// Retrying one coordinate, which this did before, cannot succeed where the
	/// first tap found no building: the camera has not moved, so every attempt
	/// hits the same patch of ground. Each attempt here tries somewhere else.
	@discardableResult
	func tapAFootprint() -> Self {
		XCTAssertTrue(
			mapView.waitForExistence(timeout: 30),
			"The map should be on screen before anything tries to tap it")

		for (index, probe) in Self.footprintProbes.enumerated() {
			mapView.coordinate(withNormalizedOffset: probe).tap()
			if closeButton.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(index + 1) at \(probe) opened no card; trying elsewhere"
			) { _ in }
		}

		XCTFail(
			"None of \(Self.footprintProbes.count) points on the map opened a building card")
		return self
	}

	/// The card's close button is the card's top edge for measuring purposes,
	/// the way the field is the picker's.
	func closeButtonTop() -> CGFloat {
		closeButton.frame.minY
	}

	/// The picker is gone once the card is up, so the card's own top edge stands
	/// in for the field's. Same hundred-point rule as `verifySheetMoved`.
	@discardableResult
	func verifyCardDroppedFrom(_ before: CGFloat) -> Self {
		let after = closeButtonTop()
		XCTAssertTrue(
			after - before > 100,
			"A row tapped from the full sheet should drop it to medium; the content's top went from \(before) to \(after)")
		return self
	}

	/// Drags the card from wherever it rests down to the collapsed stop.
	@discardableResult
	func collapseCard() -> Self {
		let grabber = app.buttons[TestIdentifiers.Map.sheetGrabber].firstMatch
		grabber.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.99)))
		return self
	}

	/// The collapsed stop rests at the foot of the screen. Checked on the sheet's
	/// own box rather than on anything inside it, so that a drag which stopped
	/// at the middle stop fails here instead of letting the header check pass
	/// on a card tall enough to hold anything.
	@discardableResult
	func verifyCardCollapsed() -> Self {
		let sheet = sheetFrame()
		let windowHeight = app.windows.firstMatch.frame.height
		XCTContext.runActivity(named: "sheet \(sheet) in a window \(windowHeight) tall") { _ in }
		XCTAssertTrue(
			sheet.minY > windowHeight * 0.8,
			"The card should rest at the collapsed stop, at the foot of the screen; "
				+ "the sheet's top is at \(sheet.minY) of \(windowHeight)")
		return self
	}

	/// The issue this guards against: a collapsed card that cut through the
	/// building's name and its close button. Both have to lie between the
	/// sheet's top and bottom edges -- top-and-bottom only, because the stop is
	/// too short rather than too narrow, so a header that does not fit loses its
	/// lower edge. Frames, because `isHittable` answers true for content the
	/// sheet clips away.
	///
	/// The close button is checked first because its query does not depend on
	/// the title block being found, so a clipped close button is reported even
	/// if the title's lookup fails.
	@discardableResult
	func verifyCardHeaderWithinSheet() -> Self {
		let sheet = sheetFrame()
		verifyWithinSheet("close button", closeButton.frame, sheet)
		XCTAssertTrue(cardTitle.waitForExistence(timeout: 10), "The card should show the building's name")
		verifyWithinSheet("title", cardTitle.frame, sheet)
		return self
	}

	/// For a header taller than the collapsed stop, as at the largest text
	/// sizes. The close button has to lie wholly inside the sheet, and the title
	/// block's top edge at or below the sheet's top. The title's bottom may run
	/// past the sheet's bottom edge: that is the intended behaviour, and Apple
	/// Maps' own, since the header keeps its top in view and gives up its foot.
	@discardableResult
	func verifyCardHeaderTopWithinSheet() -> Self {
		let sheet = sheetFrame()
		verifyWithinSheet("close button", closeButton.frame, sheet)
		XCTAssertTrue(cardTitle.waitForExistence(timeout: 10), "The card should show the building's name")
		let title = cardTitle.frame
		XCTContext.runActivity(named: "title \(title) in sheet \(sheet)") { _ in }
		XCTAssertTrue(
			title.minY >= sheet.minY,
			"The collapsed card should keep the top of the title in view: title \(title), sheet \(sheet)")
		return self
	}

	private func verifyWithinSheet(_ name: String, _ box: CGRect, _ sheet: CGRect) {
		XCTContext.runActivity(named: "\(name) \(box) in sheet \(sheet)") { _ in }
		XCTAssertTrue(
			box.minY >= sheet.minY && box.maxY <= sheet.maxY,
			"The collapsed card should hold the whole \(name), not clip it: \(name) \(box), sheet \(sheet)")
	}

	/// The stretch of map above the sheet as it rests now, clear of the
	/// navigation bar at the top and of the sheet's grabber at the bottom.
	/// Taken before the sheet moves, it stays map at every lower stop.
	func mapAboveSheet() -> CGRect {
		XCTAssertTrue(mapView.waitForExistence(timeout: 30), "The map should be on screen")
		let map = mapView.frame
		let sheetTop = sheetFrame().minY
		return CGRect(x: map.minX, y: map.minY + 8, width: map.width, height: sheetTop - 24 - map.minY)
	}

	/// A screenshot taken once `region` has stopped changing, so a camera
	/// still easing to a building is not mistaken for where it rests.
	func settledMap(in region: CGRect) -> ScreenPixels? {
		guard var previous = ScreenPixels(app.screenshot().image) else {
			XCTFail("The screenshot should be readable as pixels")
			return nil
		}
		for _ in 1...20 {
			Thread.sleep(forTimeInterval: 0.5)
			guard let next = ScreenPixels(app.screenshot().image) else { break }
			if next.fractionDiffering(from: previous, in: region) == 0 {
				return next
			}
			previous = next
		}
		XCTFail("The map in \(region) never stopped moving")
		return nil
	}

	/// Apple Maps leaves the map where it is when its sheet changes stop; only
	/// selecting a place moves the camera. A panned map changes a quarter or
	/// more of the region, so anything past 1% is a move rather than noise.
	@discardableResult
	func verifyMapHeldStill(since before: ScreenPixels?, in region: CGRect) -> Self {
		guard let before, let after = settledMap(in: region) else { return self }
		let moved = after.fractionDiffering(from: before, in: region)
		XCTContext.runActivity(named: "\(Int(moved * 100))% of the map in \(region) changed") { _ in }
		XCTAssertTrue(
			moved < 0.01,
			"The map should stay put while the sheet changes stop; \(Int(moved * 100))% of \(region) changed")
		return self
	}

	/// The middle stop is `MAP_MIDDLE_FRACTION` (0.4613, Apple Maps' stop) of
	/// the window less its top inset, so the card's close button lands a little
	/// past halfway down (about 0.57 of an iPhone 17 Pro's window). A top in the
	/// band from 0.35 to 0.75 of the screen is at it: higher is `large`, lower
	/// is still collapsed.
	@discardableResult
	func verifyCardAtMedium() -> Self {
		let top = closeButtonTop()
		let height = app.windows.firstMatch.frame.height
		XCTAssertTrue(
			top > height * 0.35 && top < height * 0.75,
			"The card should be at the middle stop; its top is at \(top) of \(height)")
		return self
	}

	/// Drags the card from wherever it rests up to the large stop.
	@discardableResult
	func expandCard() -> Self {
		let grabber = app.buttons[TestIdentifiers.Map.sheetGrabber].firstMatch
		grabber.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.02)))
		// The stop is only settled once the close button stops moving.
		var previous = closeButton.frame.minY
		for _ in 1...10 {
			Thread.sleep(forTimeInterval: 0.3)
			let now = closeButton.frame.minY
			if abs(now - previous) < 0.5 { break }
			previous = now
		}
		return self
	}

	/// The card's section headings, in the order they appear from the top.
	///
	/// The card is a lazy list: a heading below the fold has no element until
	/// it is scrolled into view. So the card is scrolled a screen at a time, and
	/// each heading is placed by the scroll step it first appeared in, then by
	/// its height within that step.
	@discardableResult
	func verifySectionOrder(_ expected: [String], among all: [String]) -> Self {
		var seen: [String: (step: Int, y: CGFloat)] = [:]
		for step in 0..<8 {
			for title in all where seen[title] == nil {
				let heading = app.staticTexts.matching(NSPredicate(format: "label == %@", title)).firstMatch
				if heading.exists && heading.frame.minY > closeButton.frame.maxY {
					seen[title] = (step, heading.frame.minY)
				}
			}
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.75))
				.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.35)))
		}
		let order = seen.sorted { ($0.value.step, $0.value.y) < ($1.value.step, $1.value.y) }.map(\.key)
		XCTContext.runActivity(named: "Headings in order: \(order)") { _ in }
		XCTAssertEqual(order, expected, "The card's sections should run in Maps' order")
		return self
	}

	/// The card's Hours status row ("Open until 10 PM"), which only a card
	/// showing some venue's hours has.
	@discardableResult
	func verifyHoursStatus() -> Self {
		let status = app.descendants(matching: .any)[TestIdentifiers.Hours.status].firstMatch
		XCTAssertTrue(status.waitForExistence(timeout: 30), "The card should show its hours' status row")
		return self
	}
}
