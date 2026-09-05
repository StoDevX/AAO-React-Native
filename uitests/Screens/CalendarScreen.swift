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

	/// Every category is a menu item, so a UIMenu action is a button.
	@discardableResult
	func checkCategoriesListed() -> Self {
		for category in TestIdentifiers.Calendar.categories {
			XCTContext.runActivity(named: category) { _ in
				XCTAssertTrue(
					app.buttons[category].waitForExistence(timeout: 30),
					"\(category) should be offered in the picker")
			}
		}
		return self
	}

	/// Tap a category in the open menu.
	@discardableResult
	func selectCategory(_ category: String) -> Self {
		let item = app.buttons[category]
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
			"\(category) should be offered in the picker")
		item.tap()
		return self
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
	func menuIsPresented() -> Bool {
		app.buttons[TestIdentifiers.Calendar.categories[0]].exists
	}

	/// Close the menu by tapping well away from it -- the toolbar button is at
	/// the bottom right and the menu opens upward from it, so the top left is
	/// clear of both.
	@discardableResult
	func dismissMenu() -> Self {
		if menuIsPresented() {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
			_ = app.buttons[TestIdentifiers.Calendar.categories[0]].waitForNonExistence(timeout: 10)
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
		let matches = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Calendar.dayCellPrefix)
		)

		// Each frame is read once and carried along: a comparator that reached for
		// `frame` would ask the app again on every comparison.
		let leading = (0..<min(limit, matches.count)).map { index in
			let cell = matches.element(boundBy: index)
			return (cell: cell, minX: cell.frame.minX)
		}

		return leading.sorted { $0.minX < $1.minX }.map { $0.cell }
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

	/// Sunday of the current week leads the strip, so its cell should be the
	/// leftmost one.
	@discardableResult
	func verifySundayLeadsTheStrip() -> Self {
		verifyStripIsPresent()

		guard let first = dayCells().first else {
			XCTFail("The strip should have day cells")
			return self
		}

		var calendar = Calendar(identifier: .gregorian)
		calendar.locale = Locale(identifier: "en_US_POSIX")
		let sunday = calendar.date(
			from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())
		)!
		let expected = TestIdentifiers.Calendar.dayCell(sunday)
		XCTAssertEqual(
			first.identifier, expected,
			"The strip should start at Sunday of this week")
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
}
