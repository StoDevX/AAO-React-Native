import XCTest

struct CalendarScreen: Screen {
	let app: XCUIApplication

	/// The toolbar picker: drawn by the Calendar alone.
	var mounted: XCUIElement {
		app.buttons[TestIdentifiers.Calendar.picker]
	}

	/// Opens the Calendar and waits for its toolbar picker. Opening a URL
	/// relaunches the app, and a relaunched app shows no home screen while it
	/// is still blank, so `open(route:)` alone returns before the Calendar has
	/// mounted -- on a slow CI runner, long before.
	@discardableResult
	func navigate() -> Self {
		open(route: "/calendar", mountedWhen: mounted)
	}

	/// Open the toolbar menu that chooses which calendars the list merges.
	@discardableResult
	func openPicker() -> Self {
		tap(
			mounted, until: app.staticTexts[TestIdentifiers.Calendar.calendarsSection],
			named: "the Calendar picker")
	}

	/// Tap an item in whichever menu is open. A category and an organisation are
	/// Toggles inside a Menu and Reset Filters is a Button; all three reach
	/// XCUITest as buttons labelled with their titles.
	@discardableResult
	func tapMenuItem(_ title: String) -> Self {
		let item = app.buttons[title]
		XCTAssertTrue(
			item.waitUntilExists(timeout: 30),
			"\(title) should be offered in the picker")
		item.tap()
		return self
	}

	/// Open one of the picker's two filter submenus. A nested Menu reaches
	/// XCUITest as a button, and its choices only enter the hierarchy once it
	/// has been tapped.
	///
	/// Matched on the prefix: a row names its selection after a colon once that
	/// axis is filtered, so the exact label depends on the state of the list.
	@discardableResult
	func openSubmenu(_ title: String) -> Self {
		let row = app.buttons.matching(
			NSPredicate(format: "label BEGINSWITH %@", title)
		).firstMatch
		XCTAssertTrue(
			row.waitUntilExists(timeout: 30),
			"\(title) should be a row of the open picker")
		row.tap()
		return self
	}

	/// Clear the filter from the open picker. The action dismisses the menu, so
	/// nothing after it needs to.
	@discardableResult
	func tapResetFilters() -> Self {
		tapMenuItem(TestIdentifiers.Calendar.resetFilters)
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.Calendar.calendarsSection].waitUntilGone(timeout: 10),
			"Reset Filters should close the picker")
		return self
	}

	/// Whether the menu is still on screen.
	///
	/// Keyed on the CALENDARS header rather than on a category: categories come
	/// from the events, so a test that has switched every calendar off would
	/// otherwise read an open menu as closed.
	///
	/// This reads a menu that is taller than the screen as closed. iOS makes an
	/// over-tall menu scroll, and a header scrolled out of the viewport leaves
	/// the accessibility hierarchy entirely -- so the fixture calendar keeps the
	/// menu short enough to draw whole. See `TestIdentifiers.Calendar`.
	func menuIsPresented() -> Bool {
		app.staticTexts[TestIdentifiers.Calendar.calendarsSection].exists
	}

	/// Either axis's row, wherever the picker currently is. The parent menu
	/// draws both as the rows that open its submenus; an open submenu draws its
	/// own as the title above its choices, with the same label.
	private func axisRow() -> XCUIElement {
		app.buttons.matching(
			NSPredicate(
				format: "label BEGINSWITH %@ OR label BEGINSWITH %@",
				TestIdentifiers.Calendar.categoryMenu,
				TestIdentifiers.Calendar.organizationMenu)
		).firstMatch
	}

	/// Whether the picker is up, counting a submenu drawn over its parent.
	///
	/// Two readings because neither covers both states. Opening a submenu
	/// replaces everything the parent drew, CALENDARS header included, so
	/// `menuIsPresented` alone reads an open submenu as no menu at all. An axis
	/// row alone is worse: an axis with nothing to offer draws an empty Menu,
	/// which SwiftUI renders as no row, so a picker opened with every calendar
	/// switched off has neither axis in it.
	func pickerIsPresented() -> Bool {
		menuIsPresented() || axisRow().exists
	}

	/// Close the menu by tapping well away from it -- the toolbar button is at
	/// the bottom right and the menu opens upward from it, so the top left is
	/// clear of both.
	///
	/// Checks both `menuIsPresented` and `pickerIsPresented`: the parent menu
	/// with no calendar enabled draws the CALENDARS header but no axis row (see
	/// `pickerIsPresented`), and an open submenu is the opposite -- an axis row
	/// with no CALENDARS header. Gating the tap on only one of the two silently
	/// skips it whenever the other is what is actually on screen, leaving the
	/// menu open under whatever the test does next.
	@discardableResult
	func dismissMenu() -> Self {
		if menuIsPresented() || pickerIsPresented() {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
			XCTAssertTrue(
				app.staticTexts[TestIdentifiers.Calendar.calendarsSection].waitUntilGone(timeout: 10),
				"Tapping away from the picker should close its CALENDARS section")
			XCTAssertTrue(
				axisRow().waitUntilGone(timeout: 10),
				"Tapping away from the picker should close it, submenu and all")
		}
		return self
	}

	// MARK: - Day picker strip

	@discardableResult
	func verifyStripIsPresent() -> Self {
		let cell = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.dayCellPrefix)
		).firstMatch
		XCTAssertTrue(
			cell.waitUntilExists(timeout: 30),
			"The day picker strip should be above the list")
		return self
	}

	/// The day cells with any of their frame inside the window, leading to
	/// trailing.
	///
	/// Read from one snapshot of the app rather than a query per cell: each
	/// query is a round trip, and twenty-odd of them take seconds. The
	/// strip and the list are both made of buttons, and only the identifier
	/// separates them.
	private func visibleDayCells() -> [XCUIElementSnapshot] {
		let root: XCUIElementSnapshot
		do {
			root = try app.snapshot()
		} catch {
			XCTFail("The app's accessibility tree should be readable: \(error)")
			return []
		}
		let window = app.frame
		var cells: [XCUIElementSnapshot] = []
		var pending = [root]
		while let node = pending.popLast() {
			if node.elementType == .button,
				node.identifier.hasPrefix(TestIdentifiers.Calendar.dayCellPrefix),
				!node.frame.intersection(window).isEmpty
			{
				cells.append(node)
			}
			pending.append(contentsOf: node.children)
		}
		return cells.sorted { $0.frame.minX < $1.frame.minX }
	}

	/// The frame of the leftmost day cell that starts inside the strip.
	///
	/// A cell dragged off the leading edge keeps a frame, and its origin goes
	/// negative rather than disappearing, so after a swipe the leftmost visible
	/// cell can be a sliver the user cannot see.
	private func leadingVisibleDayCellFrame() -> CGRect? {
		visibleDayCells().first { $0.frame.minX >= 0 }?.frame
	}

	/// Drags the strip one week toward the leading edge and lets it settle.
	///
	/// A coordinate drag rather than `swipeLeft()` on a cell: a cell is 44pt
	/// wide, and a swipe inside it travels nowhere near a week. The drag covers
	/// most of a week so the snap has to choose the next Sunday rather than fall
	/// back to the one it started from, and it is slow enough not to fling past
	/// it.
	@discardableResult
	func swipeStripToNextWeek() -> Self {
		guard let strip = leadingVisibleDayCellFrame() else {
			XCTFail("The strip should have a day cell to drag from")
			return self
		}

		let origin = app.coordinate(withNormalizedOffset: .zero)
		let start = origin.withOffset(CGVector(dx: strip.midX + 280, dy: strip.midY))
		let end = origin.withOffset(CGVector(dx: strip.midX + 40, dy: strip.midY))
		start.press(forDuration: 0.1, thenDragTo: end)
		return self
	}

	/// Taps the cell for a given ISO day. It has to be on screen already --
	/// `XCUIElement.tap()` on an offscreen cell scrolls the wrong view.
	@discardableResult
	func tapDay(_ isoDay: String) -> Self {
		let cell = app.buttons[TestIdentifiers.Calendar.dayCellPrefix + isoDay]
		XCTAssertTrue(
			cell.waitUntilExists(timeout: 10),
			"The strip should offer \(isoDay)")
		cell.tap()
		return self
	}

	/// The identifier of the day currently marked selected.
	///
	/// The selection is drawn as a filled circle, which a screenshot shows and a
	/// query cannot. `accessibilityState.selected` is what makes it assertable.
	func selectedDay() -> String? {
		let selected = app.buttons.matching(
			NSPredicate(
				format: "identifier BEGINSWITH %@ AND isSelected == true",
				TestIdentifiers.Calendar.dayCellPrefix)
		).firstMatch
		guard selected.waitUntilExists(timeout: 5) else {
			return nil
		}
		return selected.identifier
	}

  /// The currently visible days on the date picker, leading to trailing. A
  /// cell counts when any of its frame is inside the window, so a sliver at
  /// either edge counts, as it does for `isHittable`.
  func datePickerDayIdentifiers() -> [String] {
    visibleDayCells().map { $0.identifier }
  }

  /// Wait for the strip to show exactly `expected`. A scroll to a week is
  /// animated, and a cell at the strip's edge is off screen until it has
  /// arrived, so a reading taken as the scroll starts is short a day.
  @discardableResult
  func verifyStripShows(_ expected: [String], _ message: String, timeout: TimeInterval = 10) -> Self {
    var last: [String] = []
    _ = waitUntil("Waiting \(timeout)s for the strip to show \(expected)", timeout: timeout) {
      last = datePickerDayIdentifiers()
      return last == expected
    }
    XCTAssertEqual(last, expected, message)
    return self
  }

	/// Tap the bottom-bar Today button.
	@discardableResult
	func tapToday() -> Self {
		let button = app.buttons[TestIdentifiers.Calendar.today]
		XCTAssertTrue(
			button.waitUntilExists(timeout: 30),
			"Today should be in the bottom bar")
		button.tap()
		return self
	}

  func visibleRows() -> XCUIElementQuery {
    app.buttons.matching(.beginsWith(TestIdentifiers.Calendar.eventRowPrefix))
  }

	/// A row for `title` is in the list, found by its own identifier.
	///
	/// This, not a count of rows, is how a test asks whether a filter let an
	/// event through: the list is a lazy stack, so its row count is how far
	/// ahead SwiftUI has built rather than how many events the list holds, and
	/// two counts taken at different scroll offsets differ without anything
	/// about the data having changed.
	@discardableResult
	func verifyRowPresent(_ title: String) -> Self {
		XCTAssertTrue(
			row(title).waitUntilExists(timeout: 10),
			"\(title) should be in the list")
		return self
	}

	/// The counterpart to `verifyRowPresent`, for an event a filter excludes.
	@discardableResult
	func verifyRowAbsent(_ title: String) -> Self {
		XCTAssertTrue(
			row(title).waitUntilGone(timeout: 10),
			"\(title) should have been filtered out of the list")
		return self
	}

	/// Whether the day on show has finished loading: it lists an event, or says
	/// it has none, which Day view says only once its calendars have answered.
	func waitUntilDayLoads(timeout: TimeInterval = 30) -> Bool {
		let loaded = NSPredicate(
			format: "identifier BEGINSWITH %@ OR label BEGINSWITH %@",
			TestIdentifiers.Calendar.eventRowPrefix, "Nothing on ")
		return app.descendants(matching: .any).matching(loaded).firstMatch.waitUntilExists(timeout: timeout)
	}

	private func row(_ title: String) -> XCUIElement {
		app.buttons["\(TestIdentifiers.Calendar.eventRowPrefix)\(title)"]
	}

	// MARK: - View mode

	/// Whether a day's cell reports having events.
	///
	/// Read off the cell's accessibility label rather than off the dot view. A
	/// dot is a bare `View` with no accessibility of its own, so it may not
	/// reach the hierarchy at all -- and a query that cannot fail is worse than
	/// no query. The label is what `day-picker-strip.tsx` appends "has events"
	/// to, and it is also what VoiceOver reads, so this asserts the thing that
	/// actually matters.
	func dayHasEvents(_ isoDay: String) -> Bool {
		let cell = app.buttons[TestIdentifiers.Calendar.dayCellPrefix + isoDay]
		guard cell.waitUntilExists(timeout: 10) else { return false }
		return cell.label.hasSuffix("has events")
	}

	/// A day's notice, actually painted -- not merely present in the tree.
	///
	/// `exists` is true for a view a zero-height host has collapsed to
	/// nothing; that collapse is a real bug (a `RNHostView` sized to its
	/// SwiftUI-flexible child's zero intrinsic size) that an existence check
	/// alone cannot see. `frame.height` and `isHittable` both read zero for a
	/// collapsed host, so either would catch it; both are checked so a test
	/// reading this failure sees which one tripped.
	@discardableResult
	func verifyNoticeVisible(_ text: String) -> Self {
		// If the notice is split into title and description (separated by ". "),
		// SwiftUI's ContentUnavailableView draws them as separate text elements,
		// so no single element contains the entire text. In that case, we verify
		// the title part is visible.
		let parts = text.components(separatedBy: ". ")
		let titlePart = parts.first ?? text

		// `.firstMatch` rather than the `[text]` subscript: a `NoticeView`'s
		// `Text` reaches the accessibility tree as two nested elements with the
		// same label, and reading `frame`/`isHittable` demands a single match --
		// unlike `exists`, which is satisfied by "at least one" and so cannot
		// see this collapse at all.
		let notice = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", titlePart)).firstMatch
		XCTAssertTrue(
			notice.waitUntilExists(timeout: 10),
			"\"\(titlePart)\" should be on screen")
		XCTContext.runActivity(named: "\"\(titlePart)\" frame is \(notice.frame), isHittable \(notice.isHittable)") {
			_ in
		}
		XCTAssertGreaterThan(
			notice.frame.height, 0,
			"\"\(titlePart)\" exists in the hierarchy but has collapsed to zero height")
		XCTAssertTrue(
			notice.isHittable,
			"\"\(titlePart)\" exists but is not hittable, which a zero-size element never is")
		return self
	}
}
