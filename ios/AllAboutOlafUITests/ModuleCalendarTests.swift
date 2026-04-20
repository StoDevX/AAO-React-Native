import XCTest

final class ModuleCalendarTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyCalendarTitle()
	}

	func testCalendarTabsCanBeOpened() throws {
		CalendarScreen(app: app)
			.navigate()
			.checkTabs()
	}
}
