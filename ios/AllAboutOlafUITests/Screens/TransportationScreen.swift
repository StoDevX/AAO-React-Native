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
				let tabElement = app.staticTexts[tab].firstMatch
				XCTAssertTrue(
					tabElement.waitForExistence(timeout: 30),
					"\(tab) tab should be visible")
			}
		}
		return self
	}
}
