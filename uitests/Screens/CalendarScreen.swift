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
}
