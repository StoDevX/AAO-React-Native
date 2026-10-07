import XCTest

struct TransitScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[TestIdentifiers.Transit.title]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/transit", mountedWhen: mounted)
	}

	/// A line's widget header, which carries the line name and what it is
	/// doing -- "Express Bus, Running" -- as one label.
	private func lineHeader(_ line: String) -> XCUIElement {
		app.elementWithLabel(startingWith: line)
	}

	/// Open a line's full timetable by pressing its widget header.
	@discardableResult
	func openLine(_ line: String) -> Self {
		tap(lineHeader(line), until: dayMenu, named: "\(line)'s widget")
	}

	/// Press a stop cell in a widget's strip. Every cell opens the line's full
	/// timetable, the same as the header, so this reaches the sheet by the
	/// short way. The cell's label is the stop name and its departure --
	/// "St. Olaf College, 1:05 PM" -- so the name is a prefix.
	@discardableResult
	func openTimetableFromStrip(_ stop: String) -> Self {
		tap(app.elementWithLabel(startingWith: stop), until: dayMenu, named: "\(stop) in the strip")
	}

	/// The first line's strip, which a swipe is aimed at and a stop is looked
	/// for inside.
	private var stopStrip: XCUIElement {
		app.element(matching: TestIdentifiers.Transit.stopStrip)
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
	/// its presence says the sheet is up -- unlike the footer text, which all
	/// three screens in this feature render.
	private var dayMenu: XCUIElement {
		app.buttons[TestIdentifiers.Transit.dayMenuDefaultLabel].firstMatch
	}

	/// Pick a day from the sheet's navigation bar menu.
	@discardableResult
	func pickDay(_ day: String) -> Self {
		let option = app.buttons[day].firstMatch
		tap(dayMenu, until: option, named: "the day menu")
		// A native menu item: its tap is UIKit's to deliver, not JavaScript's.
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
}
