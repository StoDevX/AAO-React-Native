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

	@discardableResult
	func checkTabs() -> Self {
		for tab in TestIdentifiers.Calendar.tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabButton = app.tabButton(tab)
				XCTAssertTrue(
					tabButton.waitForExistence(timeout: 30),
					"\(tab) tab should be visible")
				tabButton.tap()
			}
		}
		return self
	}
}
