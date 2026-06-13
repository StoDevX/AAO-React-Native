import XCTest

struct TransportationScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.transportation)
	}

	@discardableResult
	func checkTabs() -> Self {
		for tab in TestIdentifiers.Transportation.tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabElement = app.tabButton(tab)
				XCTAssertTrue(
					tabElement.waitForExistence(timeout: 30),
					"\(tab) segment should be visible")
			}
		}
		return self
	}
}
