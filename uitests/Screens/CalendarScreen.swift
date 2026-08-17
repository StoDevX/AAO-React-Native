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

	/// Every calendar is a menu item, so a UIMenu action is a button.
	@discardableResult
	func checkCalendarsListed() -> Self {
		for calendar in TestIdentifiers.Calendar.calendars {
			XCTContext.runActivity(named: calendar) { _ in
				XCTAssertTrue(
					app.buttons[calendar].waitForExistence(timeout: 30),
					"\(calendar) should be offered in the picker")
			}
		}
		return self
	}

	/// Tap a calendar in the open menu.
	@discardableResult
	func toggle(_ calendar: String) -> Self {
		let item = app.buttons[calendar]
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
			"\(calendar) should be offered in the picker")
		item.tap()
		return self
	}

	/// Assert a calendar is ticked in the open menu.
	///
	/// A screenshot of a merged list is only worth keeping if both calendars
	/// really are on -- one that quietly failed to switch on looks the same as a
	/// day that happened to hold no events from it.
	@discardableResult
	func verifyChecked(_ calendar: String) -> Self {
		let item = app.buttons.matching(
			NSPredicate(format: "label == %@ AND isSelected == true", calendar)
		).firstMatch
		XCTAssertTrue(
			item.waitForExistence(timeout: 30),
			"\(calendar) should be ticked in the picker")
		return self
	}

	/// Whether the menu is still on screen, which is what `unstable_keepPresented`
	/// is meant to buy: a UIMenu's items only exist in the tree while it is open.
	func menuIsPresented() -> Bool {
		app.buttons[TestIdentifiers.Calendar.calendars[0]].exists
	}

	/// Close the menu by tapping well away from it -- the toolbar button is at
	/// the bottom right and the menu opens upward from it, so the top left is
	/// clear of both.
	@discardableResult
	func dismissMenu() -> Self {
		if menuIsPresented() {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
			_ = app.buttons[TestIdentifiers.Calendar.calendars[0]].waitForNonExistence(timeout: 10)
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

	/// The event rows currently on screen.
	///
	/// Found by elimination rather than by name: their titles come from the live
	/// calendars, so there is nothing fixed to ask for. `listTop` keeps the header
	/// out, and the picker is excluded by its label since it now sits below the
	/// list rather than above it.
	private func rows(listTop: CGFloat) -> [XCUIElement] {
		app.buttons.allElementsBoundByIndex.filter {
			$0.exists && $0.isHittable && $0.frame.minY > listTop
				&& $0.label != TestIdentifiers.Calendar.picker
		}
	}

	/// Scroll to the end of the list.
	///
	/// The end is where two swipes running leave the bottom-most row in the same
	/// place; the list is finite, so this terminates well inside `limit`.
	@discardableResult
	func scrollToEnd(listTop: CGFloat = 150, limit: Int = 25) -> Self {
		var previous = rows(listTop: listTop).last?.frame.maxY
		for _ in 1...limit {
			app.swipeUp()
			let current = rows(listTop: listTop).last?.frame.maxY
			if current == previous {
				return self
			}
			previous = current
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

		guard let last = rows(listTop: listTop).max(by: { $0.frame.maxY < $1.frame.maxY }) else {
			XCTFail("The list should still have rows at its end")
			return self
		}

		XCTContext.runActivity(
			named: "Last row \"\(last.label)\" ends at \(last.frame.maxY);"
				+ " the Calendars button starts at \(picker.frame.minY)"
		) { _ in }

		XCTAssertLessThanOrEqual(
			last.frame.maxY, picker.frame.minY,
			"The bottom bar should not cover the last row of the list")
		return self
	}

	/// Open the first event in the list.
	@discardableResult
	func openFirstEvent(listTop: CGFloat = 150) -> Self {
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Calendar.picker].waitForExistence(timeout: 30),
			"The calendar screen should be up before looking for a row")

		guard let row = rows(listTop: listTop).first else {
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
