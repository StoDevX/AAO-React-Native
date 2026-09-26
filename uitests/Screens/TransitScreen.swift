import XCTest

struct TransitScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.transit)
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
		scrollUntilExists(header, in: list)
		XCTAssertTrue(
			header.exists,
			"\(line) should have a widget on the Transportation screen")
		return self
	}

	/// A line has no widget anywhere on the screen. Sweeps the whole list from
	/// the top looking for its header rather than trusting one glance: the
	/// sections build lazily, so a widget below the fold is absent from the
	/// tree and would read as missing without ever having been ruled out.
	@discardableResult
	func verifyLineWidgetAbsent(_ line: String) -> Self {
		scrollToTop(list)
		let header = lineHeader(line)
		scrollUntilExists(header, in: list)
		XCTAssertFalse(
			header.exists,
			"\(line) is hidden in the feed and should have no widget on the Transportation screen")
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

	/// Press a stop cell in a widget's strip. Every cell opens the line's full
	/// timetable, the same as the header, so this reaches the sheet by the
	/// short way. The cell's label is the stop name and its departure --
	/// "St. Olaf College, 1:05 PM" -- so the name is a prefix.
	@discardableResult
	func openTimetableFromStrip(_ stop: String) -> Self {
		let cell = app.elementWithLabel(startingWith: stop)
		XCTAssertTrue(
			cell.waitForExistence(timeout: 30),
			"The strip should show \(stop)")
		cell.tap()
		return self
	}

	/// The first line's strip, which a swipe is aimed at and a stop is looked
	/// for inside.
	private var stopStrip: XCUIElement {
		app.scrollViews[TestIdentifiers.Transit.stopStrip].firstMatch
	}

	/// Whether a stop cell has actually been scrolled into the strip's window.
	///
	/// Geometry rather than `exists`, because a `LazyHStack` realises cells
	/// beyond its viewport -- measured here at x=532 against a strip spanning
	/// 16 to 374, present in the tree and nowhere near the screen. And geometry
	/// rather than `isHittable`, which answered differently on two identical
	/// runs of this very test. The frames do not: the strip's own frame is the
	/// window onto the rail, so a cell whose centre falls outside it is not on
	/// screen.
	private func stripShows(_ stop: String) -> Bool {
		let cell = app.elementWithLabel(startingWith: stop)
		guard cell.exists else {
			return false
		}
		return stopStrip.frame.contains(CGPoint(x: cell.frame.midX, y: cell.frame.midY))
	}

	/// The strip is not already showing `stop`. The precondition for
	/// `verifyStripAdvancedTo`: the strip opens partway along the route,
	/// wherever the clock puts the bus, so without this a stop that happened to
	/// be on screen from the start would pass that check even if the swipe had
	/// been swallowed by the enclosing list.
	@discardableResult
	func verifyStripHasNotReached(_ stop: String) -> Self {
		XCTAssertTrue(
			stopStrip.waitForExistence(timeout: 30),
			"The first line's widget should show its stop strip")
		XCTAssertFalse(
			stripShows(stop),
			"\(stop) should be off the end of the strip before it is swiped")
		return self
	}

	/// Push the first line's strip sideways. The swipe is aimed at the strip
	/// itself rather than at the app, which would scroll the list vertically
	/// instead -- and rather than at a named stop, which may be scrolled out
	/// of view: the strip opens on the stop behind the bus, so which cells are
	/// on screen depends on where the bus is.
	@discardableResult
	func swipeStripLeft() -> Self {
		XCTAssertTrue(
			stopStrip.waitForExistence(timeout: 30),
			"The first line's widget should show its stop strip")
		stopStrip.swipeLeft()
		stopStrip.swipeLeft()
		return self
	}

	/// Assert the strip actually moved, rather than merely accepting the
	/// gesture: a stop further along the route should now be on screen.
	/// `aStop` is not a fit for this check because the route loops back
	/// through it, so its mere presence would not say which pass the strip
	/// is showing.
	@discardableResult
	func verifyStripAdvancedTo(_ stop: String) -> Self {
		let cell = app.elementWithLabel(startingWith: stop)
		XCTAssertTrue(
			cell.waitForExistence(timeout: 30),
			"Swiping the strip should scroll far enough to reveal \(stop)")
		XCTAssertTrue(
			stripShows(stop),
			"Swiping the strip should bring \(stop) into the strip's window, not merely into the tree")
		return self
	}

	/// The day menu lives only in the timetable sheet's navigation bar, so
	/// its presence is sheet-unique -- unlike the footer text, which all three
	/// screens in this feature render and which only ever discriminated
	/// because a presented sheet makes the screen behind it accessibility-inert.
	@discardableResult
	func verifyTimetableShown() -> Self {
		let menu = app.buttons[TestIdentifiers.Transit.dayMenuDefaultLabel].firstMatch
		XCTAssertTrue(
			menu.waitForExistence(timeout: 30),
			"The sheet should show the line's full timetable, day menu and all")
		return self
	}

	/// Open a stop's own schedule from inside the sheet's timetable.
	@discardableResult
	func openFirstStop() -> Self {
		let stop = app.elementWithLabel(startingWith: TestIdentifiers.Transit.aStop)
		XCTAssertTrue(
			stop.waitForExistence(timeout: 30),
			"The route should list \(TestIdentifiers.Transit.aStop) as a stop")
		stop.tap()
		return self
	}

	@discardableResult
	func verifyStopScheduleShown() -> Self {
		// The heading carries the stop's name and when its next bus is, as one
		// element -- "ST. OLAF COLLEGE — STARTS IN 3 HOURS", drawn in caps --
		// so the match is both a prefix and case-insensitive.
		let heading = app.staticTexts.matching(
			NSPredicate(format: "label BEGINSWITH[c] %@", TestIdentifiers.Transit.aStop)
		).firstMatch
		XCTAssertTrue(
			heading.waitForExistence(timeout: 30),
			"Tapping a stop should open its own schedule, headed by its name")
		return self
	}

	/// Pick a day from the sheet's navigation bar menu.
	@discardableResult
	func pickDay(_ day: String) -> Self {
		let menu = app.buttons[TestIdentifiers.Transit.dayMenuDefaultLabel].firstMatch
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

	/// The timetable lists departure times for `stop` rather than the "None"
	/// a skipped stop shows. The precondition for `verifyLineNotRunning`: without
	/// it, a timetable that was empty all along would pass that check.
	@discardableResult
	func verifyStopListsDepartures(_ stop: String) -> Self {
		let row = app.elementWithLabel(startingWith: "\(stop), ")
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"The timetable should list \(stop)")
		XCTAssertFalse(
			row.label.hasPrefix("\(stop), \(TestIdentifiers.Transit.skippedDeparture)"),
			"\(stop) should have departure times before the day changes")
		return self
	}

	/// The timetable is gone and the empty state stands in its place: the line
	/// does not run on `day`. Matched on the empty state rather than on the
	/// menu button, which relabels itself whether or not the list redrew.
	@discardableResult
	func verifyLineNotRunning(on day: String) -> Self {
		XCTAssertTrue(
			app.buttons[day].waitForExistence(timeout: 30),
			"The day menu should relabel itself to \(day)")

		let emptyState = app.elementWithLabel(
			startingWith: TestIdentifiers.Transit.lineNotRunning)
		XCTAssertTrue(
			emptyState.waitForExistence(timeout: 30),
			"Picking \(day) should redraw the timetable as a line that is not running")
		return self
	}

	/// Other Modes sits below the widgets on this screen, not behind its own
	/// tab. This scrolls all the way to the last row on the screen, which lives
	/// in Other Modes' final, headerless section -- proving the list scrolls
	/// past the widgets and that the unlabelled section is actually reached.
	@discardableResult
	func scrollToOtherModes() -> Self {
		let row = app.elementWithLabel(startingWith: TestIdentifiers.Transit.lastOtherModesRow)
		scrollUntilExists(row, in: list)
		XCTAssertTrue(
			row.exists,
			"Scrolling past the widgets should reach \(TestIdentifiers.Transit.lastOtherModesRow), the last row in Other Modes' unlabelled section")
		return self
	}
}
