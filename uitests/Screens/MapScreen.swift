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

	/// St. Olaf's map is a home tile of its own, pushing `/Map?campus=stolaf`.
	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.map)
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

	/// A building's row in the sheet's list. Matched on the label's prefix, not
	/// the whole label: a building carrying an abbreviation reads as "Buntrock
	/// Commons, BC", so an exact match would find only the ones without one.
	private func row(named name: String) -> XCUIElement {
		app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
	}

	/// Reads a row off the unfiltered list, so that its absence later means the
	/// filter dropped it rather than that it was never there.
	@discardableResult
	func verifyListed(_ name: String) -> Self {
		XCTAssertTrue(
			row(named: name).waitForExistence(timeout: 30),
			"The expanded sheet should list \(name) before anything is typed")
		return self
	}

	/// A row the query cannot match has to leave the list, which is what shows
	/// the typed text reached JavaScript. A row that still matches would stay
	/// put whether the filter ran or not, so it proves nothing.
	@discardableResult
	func verifyFilteredOut(_ name: String) -> Self {
		XCTAssertTrue(
			row(named: name).waitForNonExistence(timeout: 30),
			"Searching should drop \(name) from the list")
		return self
	}

	/// The collapsed stop rests at the foot of the screen with the field on it,
	/// which is what tells it apart from medium and large.
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
			top > windowHeight * 0.8,
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
	/// Retried, for the reason `navigateFromHome` retries: a synthesized press
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

	/// Carleton's map has no home tile of its own: its dev-only "Carleton
	/// Campus" tile opens Carleton's Hours screen, whose toolbar carries the
	/// map button. Dev mode is switched on if the tile is not there.
	@discardableResult
	func navigateToCarleton() -> Self {
		let tile = app.buttons[TestIdentifiers.Map.carletonCampusTile].firstMatch
		if !tile.waitForExistence(timeout: 10) {
			HomeScreen(app: app).longPressNotice().tapEnableDevMode()
		}
		navigateFromHome(to: TestIdentifiers.Map.carletonCampusTile)
		let mapButton = app.buttons[TestIdentifiers.Hours.mapButton].firstMatch
		XCTAssertTrue(
			mapButton.waitForExistence(timeout: 30),
			"Carleton's Hours screen should offer a map button")
		for _ in 1...3 {
			mapButton.tap()
			if searchField.waitForExistence(timeout: 10) { return self }
		}
		XCTFail("Tapping the map button never opened Carleton's map")
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

	/// Maps' photo tiles are square.
	@discardableResult
	func verifyPhotoTileSquare() -> Self {
		let tile = app.descendants(matching: .any)[TestIdentifiers.Map.cardPhoto].firstMatch
		XCTAssertTrue(tile.waitForExistence(timeout: 30), "The card should show its building's photo")
		let frame = tile.frame
		XCTContext.runActivity(named: "photo tile \(frame)") { _ in }
		XCTAssertEqual(frame.width, frame.height, accuracy: 1, "The photo tile should be square: \(frame)")
		return self
	}

	/// Opens the photo full screen and closes it, twice: the viewer has to
	/// cover the sheet, and to open again after it has been closed. The card
	/// has to be where it was each time.
	@discardableResult
	func verifyPhotoOpensFullScreenTwice() -> Self {
		let tile = app.descendants(matching: .any)[TestIdentifiers.Map.cardPhoto].firstMatch
		let viewer = app.descendants(matching: .any)[TestIdentifiers.Map.photoViewerImage].firstMatch
		let close = app.descendants(matching: .any)[TestIdentifiers.Map.photoViewerClose].firstMatch
		let window = app.windows.firstMatch.frame
		let cardTop = closeButtonTop()
		for round in 1...2 {
			XCTAssertTrue(tile.waitForExistence(timeout: 30), "The card should show its photo (round \(round))")
			tile.tap()
			XCTAssertTrue(viewer.waitForExistence(timeout: 10), "The photo should open full screen (round \(round))")
			capture("Map photo viewer, round \(round)")
			XCTAssertEqual(viewer.frame.width, window.width, accuracy: 1, "The viewer should span the screen")
			XCTAssertEqual(viewer.frame.height, window.height, accuracy: 1, "The viewer should cover the sheet")
			close.tap()
			XCTAssertTrue(viewer.waitForNonExistence(timeout: 10), "Close should close the viewer (round \(round))")
			XCTAssertTrue(closeButton.waitForExistence(timeout: 10), "The card should still be there (round \(round))")
			XCTAssertEqual(closeButtonTop(), cardTop, accuracy: 1, "The card should be at the same stop (round \(round))")
		}
		return self
	}

	/// More on the Departments heading opens every department in a grid.
	@discardableResult
	func verifyMoreShowsEveryDepartment(_ count: Int) -> Self {
		let more = app.buttons[TestIdentifiers.Map.departmentsMore].firstMatch
		XCTAssertTrue(more.waitForExistence(timeout: 30), "Departments should offer More")
		more.tap()
		let grid = app.descendants(matching: .any)[TestIdentifiers.Map.departmentsGrid].firstMatch
		XCTAssertTrue(grid.waitForExistence(timeout: 10), "More should open the grid")
		capture("Departments grid")
		let tiles = grid.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Open ")).count
		XCTAssertEqual(tiles, count, "The grid should hold every department")
		return self
	}

	/// About opens clamped, and a tap shows the rest.
	@discardableResult
	func verifyAboutExpands() -> Self {
		let about = app.descendants(matching: .any)[TestIdentifiers.Map.cardAbout].firstMatch
		XCTAssertTrue(about.waitForExistence(timeout: 30), "The card should show its About text")
		let before = about.frame.height
		about.tap()
		Thread.sleep(forTimeInterval: 0.6)
		let after = about.frame.height
		XCTContext.runActivity(named: "About \(before) then \(after)") { _ in }
		XCTAssertGreaterThan(after, before + 20, "A tap should show the rest of a clamped About")
		return self
	}
}
