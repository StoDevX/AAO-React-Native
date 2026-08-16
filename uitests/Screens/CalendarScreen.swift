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

	/// Whether the menu is still on screen, which is what `unstable_keepPresented`
	/// is meant to buy: a UIMenu's items only exist in the tree while it is open.
	func menuIsPresented() -> Bool {
		app.buttons[TestIdentifiers.Calendar.calendars[0]].exists
	}

	/// Close the menu by tapping well away from it -- the toolbar button is at
	/// the top right, so the bottom left is clear of both it and the menu.
	@discardableResult
	func dismissMenu() -> Self {
		if menuIsPresented() {
			app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.9)).tap()
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

	/// Open the first event in the list.
	///
	/// Rows are found by elimination rather than by name: their titles come from
	/// the live calendars, so there is nothing fixed to ask for. The toolbar sits
	/// above `listTop`, which is what keeps the picker and the back button out.
	@discardableResult
	func openFirstEvent(listTop: CGFloat = 150) -> Self {
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Calendar.picker].waitForExistence(timeout: 30),
			"The calendar screen should be up before looking for a row")

		let rows = app.buttons.allElementsBoundByIndex.filter {
			$0.exists && $0.isHittable && $0.frame.minY > listTop
				&& $0.label != TestIdentifiers.Calendar.picker
		}

		guard let row = rows.first else {
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
}
