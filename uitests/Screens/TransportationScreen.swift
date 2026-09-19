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
		// Swipe the list itself. The tab bar floats over the bottom of the
		// screen, so a swipe aimed at the app as a whole can land on that
		// instead. A SwiftUI List is a table, not a scroll view.
		let list = app.tables.firstMatch
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
		// element -- "ST. OLAF COLLEGE — STARTS IN 3 HOURS (12:00PM)", drawn in
		// caps -- so the match is both a prefix and case-insensitive.
		let heading = app.staticTexts.matching(
			NSPredicate(format: "label BEGINSWITH[c] %@", TestIdentifiers.Transportation.aStop)
		).firstMatch
		XCTAssertTrue(
			heading.waitForExistence(timeout: 30),
			"Tapping a stop should open its own schedule, headed by its name")
		return self
	}

	/// Pick a day from the navigation bar's menu.
	@discardableResult
	func pickDay(_ day: String) -> Self {
		let menu = app.buttons[TestIdentifiers.Transportation.dayMenuDefaultLabel].firstMatch
		XCTAssertTrue(
			menu.waitForExistence(timeout: 30),
			"The navigation bar should offer a day menu labelled Today")
		menu.tap()

		let option = app.buttons[day].firstMatch
		XCTAssertTrue(
			option.waitForExistence(timeout: 30),
			"The day menu should offer \(day)")
		option.tap()
		return self
	}

	/// Assert the day menu relabelled itself and the timetable's section title
	/// names the day on screen. Matching on the em-dash that follows the day
	/// in the title -- "Saturday — Not running today" -- rules out the
	/// toolbar button, whose own label is the bare day name and never
	/// contains it.
	@discardableResult
	func verifyScheduleShows(day: String) -> Self {
		XCTAssertTrue(
			app.buttons[day].waitForExistence(timeout: 30),
			"The day menu should relabel itself to \(day)")

		let title = app.staticTexts.matching(
			NSPredicate(format: "label BEGINSWITH[c] %@", "\(day) —")
		).firstMatch
		XCTAssertTrue(
			title.waitForExistence(timeout: 30),
			"The section title should lead with \(day) —")
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
