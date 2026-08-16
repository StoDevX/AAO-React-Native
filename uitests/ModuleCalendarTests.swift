import XCTest

class ModuleCalendarTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyCalendarTitle()
	}

	func testCalendarPickerOffersEveryCalendar() throws {
		CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.checkCalendarsListed()
	}
}
