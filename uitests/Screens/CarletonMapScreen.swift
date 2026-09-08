import XCTest

struct CarletonMapScreen: Screen {
	let app: XCUIApplication

	/// The picker sheet's search field: a UISearchBar's text field, which is
	/// the sheet's only content at the collapsed detent it opens at.
	private var searchField: XCUIElement {
		app.searchFields[TestIdentifiers.CarletonMap.search].firstMatch
	}

	/// Scoped to the search bar rather than the whole screen: the building
	/// card's own dismiss button carries the same label, so an unscoped query
	/// could answer for either.
	private var cancelButton: XCUIElement {
		app.otherElements[TestIdentifiers.CarletonMap.search]
			.buttons[TestIdentifiers.CarletonMap.cancel].firstMatch
	}

	/// Its own `testID` rather than a label query: the search bar's Cancel
	/// carries the same "Close" label, and the picker is still mounted while
	/// this is waited on, so a label-only query could be satisfied by the
	/// wrong element.
	private var closeButton: XCUIElement {
		app.buttons[TestIdentifiers.CarletonMap.cardCloseButton].firstMatch
	}

	/// The map has no home tile of its own -- both campuses' Campus screens
	/// carry the map button now, so getting to `/Map` means opening one of
	/// those screens first and tapping its top-right button. Defaults to
	/// Carleton's tile; pass `TestIdentifiers.Buttons.campus` for St. Olaf's.
	@discardableResult
	func navigate(from campusTile: String = TestIdentifiers.Buttons.carletonCampus) -> Self {
		navigateFromHome(to: campusTile)

		let mapButton = app.buttons[TestIdentifiers.Campus.mapButton].firstMatch
		XCTAssertTrue(
			mapButton.waitForExistence(timeout: 30),
			"\(campusTile)'s Campus screen should offer a map button")

		// Retried for the reason navigateFromHome retries: a synthesized press
		// on a button whose host has mounted but whose action still has to
		// reach JavaScript lands natively and does nothing.
		for attempt in 1...3 {
			mapButton.tap()
			if searchField.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(
				named: "Tap \(attempt) on the map button did not open the map; retrying"
			) { _ in }
		}

		XCTFail("Tapping the map button never opened the map")
		return self
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

	/// Reads a row off the unfiltered list, so that its absence later means the
	/// filter dropped it rather than that it was never there.
	@discardableResult
	func verifyListed(_ name: String) -> Self {
		XCTAssertTrue(
			app.buttons[name].firstMatch.waitForExistence(timeout: 30),
			"The expanded sheet should list \(name) before anything is typed")
		return self
	}

	/// A row the query cannot match has to leave the list, which is what shows
	/// the typed text reached JavaScript. A row that still matches would stay
	/// put whether the filter ran or not, so it proves nothing.
	@discardableResult
	func verifyFilteredOut(_ name: String) -> Self {
		XCTAssertTrue(
			app.buttons[name].firstMatch.waitForNonExistence(timeout: 30),
			"Searching should drop \(name) from the list")
		return self
	}

	/// The collapsed stop rests at the foot of the screen with the field on it,
	/// which is what tells it apart from medium and large.
	///
	/// That the field is the *only* thing on it is not asserted, because it
	/// cannot be from here. The category segments beneath the field answer
	/// `isHittable` at every collapsed height tried -- 44, 60, 76 and 160 --
	/// while the screen visibly changes between them, so the hit test is not
	/// measuring what the sheet shows. The capture is what that half has to be
	/// judged on.
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
	/// **This cannot see the field being clipped.** XCUITest reports an
	/// element's frame whether or not an ancestor draws over it or cuts it off,
	/// so a stop too short to hold the field passes here: at the collapsed
	/// height the app ships, the field's own frame starts 19.9pt above the
	/// sheet's top edge and the capture shows its top sliced away, while this
	/// assertion is green. Whether the stop holds the field whole, and holds
	/// nothing else, is judged on the screenshot.
	///
	/// The sheet's own box is queryable -- an `otherElement` whose frame is
	/// what the sheet shows, the smaller of the two that contain the
	/// `Sheet Grabber` button -- so comparing the field's frame against it
	/// would catch the clipping directly. That check belongs here as soon as
	/// the collapsed stop has content it can contain; see "Sizing the collapsed
	/// detent" in
	/// `docs/superpowers/specs/2026-09-07-map-sheet-search-bar-design.md`.
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

	/// A move is a change of at least a hundred points: the collapsed stop
	/// renders at about 65pt, medium at half the screen, and large at nearly
	/// all of it, so anything smaller is a scroll or a wobble, not a detent
	/// change.
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
	/// Matched on the label's prefix, not the whole label: a building carrying
	/// an abbreviation reads as "Buntrock Commons, BC", so an exact match finds
	/// St. Olaf's rows only by accident of them not having one.
	@discardableResult
	func selectBuilding(named name: String) -> Self {
		let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name)).firstMatch
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

	/// Taps the map itself, in the strip above the collapsed sheet. The
	/// initial camera frames campus, so the screen's centre lands on a
	/// footprint; which one does not matter, only that a card opens.
	@discardableResult
	func tapAFootprint() -> Self {
		for attempt in 1...3 {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
			if closeButton.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(named: "Tap \(attempt) on the map opened no card; retrying") { _ in }
		}
		XCTFail("Tapping the map never opened a building card")
		return self
	}

	@discardableResult
	func checkBuildingCardPresented() -> Self {
		XCTAssertTrue(
			closeButton.waitForExistence(timeout: 30),
			"Selecting a building should show its card, which offers a way out")
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

	/// The medium stop is half the window. A card whose top is in the middle
	/// third of the screen is at it; one hugging the bottom is still collapsed.
	@discardableResult
	func verifyCardAtMedium() -> Self {
		let top = closeButtonTop()
		let height = app.windows.firstMatch.frame.height
		XCTAssertTrue(
			top > height * 0.33 && top < height * 0.66,
			"A footprint tapped while collapsed should raise the card to medium; its top is at \(top) of \(height)")
		return self
	}
}
