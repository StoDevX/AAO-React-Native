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

	/// Open a stop's own schedule, which draws the same progress bar down a
	/// column of departure times rather than of stops.
	@discardableResult
	func openFirstStop() -> Self {
		// The rows carry a concatenated label -- the stop name and its times --
		// so the name is a prefix rather than the whole of it.
		let stop = app.elementWithLabel(startingWith: TestIdentifiers.Transportation.aStop)
		XCTAssertTrue(
			stop.waitForExistence(timeout: 30),
			"The route should list \(TestIdentifiers.Transportation.aStop) as a stop")
		stop.tap()
		return self
	}

	@discardableResult
	func verifyStopScheduleShown() -> Self {
		// The heading carries the stop's name and when its next bus is, as one
		// element -- "St. Olaf College — Starts in 3 hours (12:00pm)" -- so the
		// name is a prefix of it rather than the whole of it.
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.Transportation.aStop)
				.waitForExistence(timeout: 30),
			"Tapping a stop should open its own schedule, headed by its name")
		return self
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
