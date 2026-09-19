import XCTest

struct TransportationScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.transportation)
	}

	/// A line's widget header, which carries the line name and what it is
	/// doing -- "Express Bus, Running" -- as one label.
	private func lineHeader(_ line: String) -> XCUIElement {
		app.elementWithLabel(startingWith: line)
	}

	/// The screen's `@expo/ui` `List`, which lands as a `CollectionView` rather
	/// than the `UITableView` a plain SwiftUI `List` would give -- so a swipe
	/// aimed at `app.tables` finds nothing to scroll.
	private var list: XCUIElement {
		app.collectionViews.firstMatch
	}

	/// A line's widget is a `Section` in that list, which builds its rows
	/// lazily: one below the fold is absent from the tree entirely, not merely
	/// offscreen, so waiting longer never surfaces it. This scrolls until the
	/// header appears rather than trusting `waitForExistence` alone, which is
	/// only good for a header already on screen.
	@discardableResult
	func verifyLineWidgetShown(_ line: String) -> Self {
		let header = lineHeader(line)
		for _ in 0..<6 where !header.exists {
			list.swipeUp()
		}
		XCTAssertTrue(
			header.exists,
			"\(line) should have a widget on the Transportation screen")
		return self
	}

	/// Open a line's full timetable by pressing its widget header.
	@discardableResult
	func openLine(_ line: String) -> Self {
		let header = lineHeader(line)
		XCTAssertTrue(
			header.waitForExistence(timeout: 30),
			"\(line) should have a widget to open")
		header.tap()
		return self
	}

	/// Press a stop in a widget's strip. The cell's label is the stop name and
	/// its departure -- "St. Olaf College, 1:05 PM" -- so the name is a prefix.
	@discardableResult
	func openStopFromStrip(_ stop: String) -> Self {
		let cell = app.elementWithLabel(startingWith: stop)
		XCTAssertTrue(
			cell.waitForExistence(timeout: 30),
			"The strip should show \(stop)")
		cell.tap()
		return self
	}

	/// Push the strip sideways. The strip is a horizontal ScrollView inside a
	/// List row, so the swipe is aimed at the cell rather than at the app,
	/// which would scroll the list vertically instead.
	@discardableResult
	func swipeStripLeft(startingAt stop: String) -> Self {
		let cell = app.elementWithLabel(startingWith: stop)
		XCTAssertTrue(
			cell.waitForExistence(timeout: 30),
			"The strip should show \(stop) before it is swiped")
		cell.swipeLeft()
		cell.swipeLeft()
		return self
	}

	/// The footer sits below the route's stops, which the same lazy list
	/// building means is absent from the tree until scrolled into view.
	@discardableResult
	func verifyTimetableShown() -> Self {
		let footer = app.staticTexts[TestIdentifiers.Transportation.footer].firstMatch
		for _ in 0..<6 where !footer.exists {
			list.swipeUp()
		}
		XCTAssertTrue(
			footer.exists,
			"The sheet should show the line's full timetable, footer and all")
		return self
	}

	/// The end of the route, reached by scrolling the sheet's timetable.
	@discardableResult
	func scrollToEndOfRoute() -> Self {
		for _ in 0..<4 {
			list.swipeUp()
		}
		return self
	}

	/// Open a stop's own schedule from inside the sheet's timetable.
	@discardableResult
	func openFirstStop() -> Self {
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

	/// Pick a day from the sheet's navigation bar menu.
	@discardableResult
	func pickDay(_ day: String) -> Self {
		let menu = app.buttons["Today"].firstMatch
		XCTAssertTrue(
			menu.waitForExistence(timeout: 30),
			"The sheet's navigation bar should offer a day menu labelled Today")
		menu.tap()

		let option = app.buttons[day].firstMatch
		XCTAssertTrue(
			option.waitForExistence(timeout: 30),
			"The day menu should offer \(day)")
		option.tap()
		return self
	}

	/// Matching on the em-dash that follows the day in the section title --
	/// "Saturday — Not running today" -- rules out the toolbar button, whose
	/// own label is the bare day name and never contains it.
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

	/// Other Modes now sits below the widgets rather than behind a tab.
	@discardableResult
	func scrollToOtherModes() -> Self {
		let section = app.staticTexts["Bus"].firstMatch
		for _ in 0..<6 where !section.exists {
			list.swipeUp()
		}
		XCTAssertTrue(
			section.exists,
			"Other Modes should be reachable by scrolling past the widgets")
		return self
	}
}
