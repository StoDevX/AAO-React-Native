import XCTest

struct CalendarScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.calendar)
	}

	@discardableResult
	func verifyCalendarTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.calendar)
	}

	/// Open the toolbar menu that chooses which calendars the list merges.
	@discardableResult
	func openPicker() -> Self {
		let picker = app.buttons[TestIdentifiers.Calendar.picker]
		XCTAssertTrue(
			picker.waitForExistence(timeout: 30),
			"Calendar picker should be in the toolbar")
		picker.tap()
		return self
	}

	/// Every category is a submenu item, so a UIMenu action is a button.
	@discardableResult
	func checkCategoriesListed() -> Self {
		openSubmenu(TestIdentifiers.Calendar.categoryMenu)
		for category in TestIdentifiers.Calendar.categories {
			XCTContext.runActivity(named: category) { _ in
				XCTAssertTrue(
					app.buttons[category].waitForExistence(timeout: 30),
					"\(category) should be offered in the picker")
			}
		}
		return self
	}

	/// Tap an item in whichever menu is open. A category and an organisation are
	/// Toggles inside a Menu and Reset Filters is a Button; all three reach
	/// XCUITest as buttons labelled with their titles.
	@discardableResult
	private func tapMenuItem(_ title: String) -> Self {
		let item = app.buttons[title]
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
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
			row.waitForExistence(timeout: 30),
			"\(title) should be a row of the open picker")
		row.tap()
		return self
	}

	/// Clear the filter from the open picker. The action dismisses the menu, so
	/// nothing after it needs to.
	@discardableResult
	func tapResetFilters() -> Self {
		tapMenuItem(TestIdentifiers.Calendar.resetFilters)
		_ = app.staticTexts[TestIdentifiers.Calendar.calendarsSection]
			.waitForNonExistence(timeout: 10)
		return self
	}

	/// Tap a category, opening the Category submenu to reach it.
	@discardableResult
	func selectCategory(_ category: String) -> Self {
		openSubmenu(TestIdentifiers.Calendar.categoryMenu)
		return tapMenuItem(category)
	}

	/// Tap an organisation, opening the Organization submenu to reach it.
	@discardableResult
	func selectOrganization(_ organization: String) -> Self {
		openSubmenu(TestIdentifiers.Calendar.organizationMenu)
		return tapMenuItem(organization)
	}

	/// Assert a category is selected in the open menu.
	@discardableResult
	func verifySelected(_ category: String) -> Self {
		let item = app.buttons.matching(
			NSPredicate(format: "label == %@ AND isSelected == true", category)
		).firstMatch
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
			"\(category) should be selected in the picker")
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

	/// Whether the picker is up, counting a submenu drawn over its parent.
	///
	/// Opening a submenu replaces the parent's contents, taking the CALENDARS
	/// header with it, so a choice that exists only inside a submenu stands in
	/// for the header while one is open.
	func pickerIsPresented() -> Bool {
		if menuIsPresented() {
			return true
		}
		return app.buttons[TestIdentifiers.Calendar.categories[0]].exists
	}

	/// Close the menu by tapping well away from it -- the toolbar button is at
	/// the bottom right and the menu opens upward from it, so the top left is
	/// clear of both.
	@discardableResult
	func dismissMenu() -> Self {
		if pickerIsPresented() {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
			_ = app.staticTexts[TestIdentifiers.Calendar.calendarsSection]
				.waitForNonExistence(timeout: 10)
			_ = app.buttons[TestIdentifiers.Calendar.categories[0]]
				.waitForNonExistence(timeout: 10)
		}
		return self
	}

	/// Scroll the merged list by a fraction of a screen.
	///
	/// A short drag rather than `swipeUp()`: a full swipe flings the list past
	/// the moment a section header reaches the pin line, which is the only
	/// moment that shows whether rows pass behind it or under it.
	@discardableResult
	func nudgeList() -> Self {
		let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.7))
		let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55))
		start.press(forDuration: 0.05, thenDragTo: end)
		return self
	}

	/// Any single event row currently on screen — the first one found.
	///
	/// Event rows carry the `event-row-` prefix, so we can query them directly
	/// without iterating all buttons.
	private func anyRow(listTop: CGFloat) -> XCUIElement? {
		let row = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.eventRowPrefix)
		).firstMatch
		return row.exists ? row : nil
	}

	/// Scroll to the end of the list.
	///
	/// Swipes until two consecutive swipes leave the same row in the same place,
	/// which means the list has bottomed out.
	@discardableResult
	func scrollToEnd(listTop: CGFloat = 150, limit: Int = 25) -> Self {
		var previousLabel: String?
		var previousY: CGFloat?

		for _ in 1...limit {
			app.swipeUp()
			if let row = anyRow(listTop: listTop) {
				let label = row.label
				let y = row.frame.minY
				if label == previousLabel && y == previousY {
					return self
				}
				previousLabel = label
				previousY = y
			}
		}
		XCTFail("The list never stopped scrolling after \(limit) swipes")
		return self
	}

	/// The bottom bar floats over the list, so the list needs an inset for it:
	/// once scrolled to the end, the last row should stop above the Calendars
	/// button rather than under it.
	@discardableResult
	func verifyLastRowClearsToolbar(listTop: CGFloat = 150) -> Self {
		let picker = app.buttons[TestIdentifiers.Calendar.picker]
		XCTAssertTrue(
			picker.waitForExistence(timeout: 30),
			"The Calendars button should be in the bottom bar")

		guard let row = anyRow(listTop: listTop) else {
			XCTFail("The list should still have rows at its end")
			return self
		}

		XCTContext.runActivity(
			named: "Row \"\(row.label)\" ends at \(row.frame.maxY);"
				+ " the Calendars button starts at \(picker.frame.minY)"
		) { _ in }

		// If any visible row clears the toolbar, the list has proper inset.
		XCTAssertLessThanOrEqual(
			row.frame.maxY, picker.frame.minY,
			"The bottom bar should not cover rows of the list")
		return self
	}

	/// Open the first event in the list.
	@discardableResult
	func openFirstEvent(listTop: CGFloat = 150) -> Self {
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Calendar.picker].waitForExistence(timeout: 30),
			"The calendar screen should be up before looking for a row")

		guard let row = anyRow(listTop: listTop) else {
			XCTFail("The list should have an event to open")
			return self
		}

		XCTContext.runActivity(named: "Open \(row.label)") { _ in }

		// Retried for the same reason `navigateFromHome` retries: the row is a
		// SwiftUI button that is hittable as soon as its host mounts, while its
		// action has to reach JavaScript to push the next screen. A tap
		// synthesized in between lands natively and nothing happens.
		let share = app.buttons[TestIdentifiers.Calendar.shareEvent]
		for attempt in 1...3 {
			row.tap()
			if share.waitForExistence(timeout: 10) {
				return self
			}
			capture("row-tap-\(attempt)-did-not-reach-the-detail-screen")
			XCTContext.runActivity(named: "Tap \(attempt) on the row did not open it; retrying") { _ in
			}
			if !app.buttons[TestIdentifiers.Calendar.picker].exists {
				XCTFail("The push landed somewhere without a Share Event button; see the screenshot")
				return self
			}
		}

		XCTFail("Tapping \(row.label) never opened the event detail screen")
		return self
	}

	// MARK: - Day picker strip

	/// The leading day cells in the strip, in the order they are laid out.
	///
	/// Bound by identifier rather than by position: the strip and the list are
	/// both made of buttons, and only the identifier separates them.
	///
	/// Only the first `limit` cells are read. The strip draws a cell for every day
	/// between today and the last event it knows about, which runs to a hundred or
	/// more, and every frame a query reads is a round trip to the app -- reading
	/// them all takes minutes. Nothing asks about a day past the first screenful.
	private func dayCells(limit: Int = 14) -> [XCUIElement] {
		dayCellFrames(limit: limit).sorted { $0.frame.minX < $1.frame.minX }.map { $0.cell }
	}

	@discardableResult
	func verifyStripIsPresent() -> Self {
		let cell = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.dayCellPrefix)
		).firstMatch
		XCTAssertTrue(
			cell.waitForExistence(timeout: 30),
			"The day picker strip should be above the list")
		return self
	}

	/// Every day cell the app is currently exposing, paired with where it sits.
	///
	/// The frames are read once and carried: a comparator or filter that reached
	/// for `frame` would ask the app again on every comparison.
	private func dayCellFrames(limit: Int) -> [(cell: XCUIElement, frame: CGRect)] {
		let matches = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.dayCellPrefix)
		)

		return (0..<min(limit, matches.count)).map { index in
			let cell = matches.element(boundBy: index)
			return (cell: cell, frame: cell.frame)
		}
	}

	/// The leftmost day cell inside the strip's viewport, and its frame.
	///
	/// Distinct from `dayCells().first`: a cell dragged off the leading edge
	/// keeps a frame, and its origin goes negative rather than disappearing, so
	/// after a swipe the leftmost cell by frame is one the user cannot see.
	private func leadingVisibleDayCell(limit: Int = 21) -> (cell: XCUIElement, frame: CGRect)? {
		let onscreen = dayCellFrames(limit: limit).filter { $0.frame.minX >= 0 }
		return onscreen.min(by: { $0.frame.minX < $1.frame.minX })
	}

	/// Where the strip's leading cell sits on screen. A week the strip has
	/// snapped to puts its Sunday here; a week the strip could only scroll
	/// partway to leaves it further along.
	func leadingDayCellEdge() -> CGFloat? {
		leadingVisibleDayCell()?.frame.minX
	}

	/// The cell identifier for the Sunday `weeksOn` weeks after the Sunday of
	/// the app's frozen week.
	///
	/// The week start is pinned rather than inherited from the simulator's
	/// region settings. The app's own is unconditional -- moment's default `en`
	/// locale in `deriveDays`, and `startOf('week')` in the strip -- so a device
	/// set to a Monday-first region would otherwise fail a correct strip.
	private func sundayCell(weeksOn weeks: Int = 0) -> String {
		var calendar = Calendar(identifier: .gregorian)
		calendar.locale = Locale(identifier: "en_US_POSIX")
		calendar.timeZone = TimeZone.current
		calendar.firstWeekday = 1
		calendar.minimumDaysInFirstWeek = 1

		let week = calendar.dateInterval(
			of: .weekOfYear, for: TestIdentifiers.Calendar.frozenNow)!
		let sunday = calendar.date(byAdding: .weekOfYear, value: weeks, to: week.start)!
		return TestIdentifiers.Calendar.dayCell(sunday)
	}

	/// A Sunday leads the strip, so that cell should be the leftmost visible one.
	/// The week is measured from the app's frozen clock, not the live one;
	/// `weeksOn` counts on from it, for a strip that has been swiped along.
	///
	/// Pass `atEdge` to also pin where that Sunday came to rest. Being merely
	/// visible is not the claim -- a strip that ran out of content mid-week
	/// still shows a Sunday, just further along than one that snapped.
	@discardableResult
	func verifySundayLeadsTheStrip(weeksOn weeks: Int = 0, atEdge edge: CGFloat? = nil) -> Self {
		verifyStripIsPresent()

		guard let leading = leadingVisibleDayCell() else {
			XCTFail("The strip should have a visible day cell")
			return self
		}

		let expected = sundayCell(weeksOn: weeks)
		XCTAssertEqual(
			leading.cell.identifier, expected,
			"The strip should lead with a Sunday (expected \(expected))")

		if let edge {
			XCTAssertEqual(
				leading.frame.minX, edge, accuracy: 1.0,
				"A snapped week should bring its Sunday to the strip's leading edge")
		}
		return self
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
		guard let leading = leadingVisibleDayCell() else {
			XCTFail("The strip should have a day cell to drag from")
			return self
		}

		let strip = leading.frame
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
			cell.waitForExistence(timeout: 10),
			"The strip should offer \(isoDay)")
		cell.tap()
		return self
	}

	/// The day cells at the head of the strip should each clear the 44pt minimum
	/// for a touch target.
	///
	/// Cheap to check and worth checking: a control drawn smaller than its
	/// nominal size is the failure that no component test can see. The cells are
	/// all one component, so the ones on screen stand for the rest.
	@discardableResult
	func verifyDayCellsAreTappable() -> Self {
		verifyStripIsPresent()

		let cells = dayCells()
		XCTAssertFalse(cells.isEmpty, "The strip should have day cells")

		for cell in cells {
			// Both read once. Every mention of `identifier` or `frame` is a query the
			// app has to answer, and the four assertions below would ask five times.
			let name = cell.identifier
			let frame = cell.frame

			XCTContext.runActivity(named: "\(name) is \(frame.width)x\(frame.height)") { _ in }
			XCTAssertGreaterThanOrEqual(
				frame.height, 44,
				"\(name) is too short to tap reliably")
			XCTAssertGreaterThanOrEqual(
				frame.width, 44,
				"\(name) is too narrow to tap reliably")
		}
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
		guard selected.waitForExistence(timeout: 5) else {
			return nil
		}
		return selected.identifier
	}

	@discardableResult
	func verifySelectedDay(_ expected: String, message: String) -> Self {
		XCTAssertEqual(selectedDay(), expected, message)
		return self
	}

	/// The label of a visible event row, which is how a test tells whether the
	/// list actually moved. Row titles come from the live calendars, so the
	/// value is only ever compared against another reading of itself.
	func topRowLabel(listTop: CGFloat = 150) -> String? {
		anyRow(listTop: listTop)?.label
	}

	/// Tap the bottom-bar Today button.
	@discardableResult
	func tapToday() -> Self {
		let button = app.buttons[TestIdentifiers.Calendar.today]
		XCTAssertTrue(
			button.waitForExistence(timeout: 30),
			"Today should be in the bottom bar")
		button.tap()
		return self
	}

	/// The event detail's bottom-bar action. A bar item, so it is a button, and
	/// it carries no icon -- the title is all there is to find it by.
	@discardableResult
	func verifyAddToCalendarButton() -> Self {
		let button = app.buttons[TestIdentifiers.Calendar.addToCalendar]
		XCTAssertTrue(
			button.waitForExistence(timeout: 30),
			"The event detail should offer Add to calendar in its bottom bar")
		return self
	}

	/// Dismiss the event detail sheet, landing back on the calendar list.
	@discardableResult
	func closeEventDetail() -> Self {
		let close = app.buttons[TestIdentifiers.Calendar.closeEventDetail]
		XCTAssertTrue(
			close.waitForExistence(timeout: 30),
			"The event detail should offer a Close button")
		close.tap()
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Calendar.picker].waitForExistence(timeout: 30),
			"Dismissing the event detail should land back on the calendar")
		return self
	}

	/// A section header inside the open menu.
	@discardableResult
	func verifyMenuSection(_ title: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[title].waitForExistence(timeout: 30),
			"\(title) should be a section of the open menu")
		return self
	}

	/// Switch a calendar on or off in the open menu's CALENDARS section. A
	/// Toggle inside a Menu is a button, the same as a category is.
	@discardableResult
	func toggleCalendar(_ title: String) -> Self {
		let item = app.buttons[title]
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
			"\(title) should be offered as a calendar in the picker")
		item.tap()
		return self
	}

	/// How many event rows are on screen.
	///
	/// A count of what is rendered, not of what the calendar holds -- the list
	/// is lazy. Enough to tell "some rows" from "none", and to tell a narrowed
	/// list from an unnarrowed one, which is all any assertion here claims.
	func visibleRowCount() -> Int {
		app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.eventRowPrefix)
		).count
	}

	/// The list merges several calendars, so it can credit none of them.
	@discardableResult
	func verifyNoAttribution() -> Self {
		let caption = app.staticTexts.matching(
			NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.Calendar.attributionPrefix)
		).firstMatch
		XCTAssertFalse(
			caption.exists,
			"The calendar list should carry no attribution footer")
		return self
	}

	/// The detail screen knows which calendar its event came from, so it says.
	@discardableResult
	func verifyAttributionOnDetail() -> Self {
		let caption = app.staticTexts.matching(
			NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.Calendar.attributionPrefix)
		).firstMatch
		XCTAssertTrue(
			caption.waitForExistence(timeout: 30),
			"The event detail should credit the calendar the event came from")
		return self
	}
}
