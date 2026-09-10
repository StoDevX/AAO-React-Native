import XCTest

struct TransportationScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.transportation)
	}

	/// Scroll to the bottom of the line, where the route's last stop is.
	@discardableResult
	func scrollToEndOfRoute() -> Self {
		// Swipe the list itself. The tab bar floats over the bottom of the screen,
		// so a swipe aimed at the app as a whole can land on that instead.
		let list = app.scrollViews.firstMatch
		for _ in 0..<4 {
			list.swipeUp()
		}
		return self
	}

	@discardableResult
	func verifyEndOfRoute() -> Self {
		XCTAssertTrue(
			endOfRoute.exists,
			"The end of the route should be reachable by scrolling")
		return self
	}

	/// The list footer, which sits below the route's last stop.
	private var endOfRoute: XCUIElement {
		app.staticTexts[TestIdentifiers.Transportation.footer].firstMatch
	}

	@discardableResult
	func checkTabs() -> Self {
		for tab in TestIdentifiers.Transportation.tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabButton = app.tabButton(tab)
				XCTAssertTrue(
					tabButton.waitForExistence(timeout: 30),
					"\(tab) tab button should be visible")
			}
		}
		return self
	}
}
