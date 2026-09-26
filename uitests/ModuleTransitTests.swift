import XCTest

class ModuleTransitTests: UITestCase {
	/// The landing screen, top to bottom, on one cold launch.
	///
	/// The strip is a horizontal scroll view inside a list row, which is the
	/// arrangement most likely to have the list steal the gesture.
	///
	/// Every line gets a widget, so the screen answers "what is running" without
	/// a tap -- except one the feed has retired, which keeps its entry for
	/// released app versions to read and earns no widget here. The absence
	/// sweep scrolls the list to the bottom, so it comes after everything that
	/// reads the top.
	///
	/// Other Modes has no tab of its own -- it is a set of sections below the
	/// bus widgets, on the same screen.
	func testTheLandingScreenFromStripToOtherModes() throws {
		TransitScreen(app: app)
			.navigate()
			.verifyStripHasNotReached(TestIdentifiers.Transit.aStopFartherAlongTheRoute)
			.swipeStripLeft()
			.verifyStripAdvancedTo(TestIdentifiers.Transit.aStopFartherAlongTheRoute)
			.capture("Transit - strip scrolled")
			.verifyLineWidgetShown(TestIdentifiers.Transit.aLine)
			.verifyLineWidgetShown("Red Line")
			.capture("Transit - widgets")
			.verifyLineWidgetAbsent(TestIdentifiers.Transit.aHiddenLine)
			.scrollToOtherModes()
			.capture("Transit - Other Modes")
	}

	/// A single stop's schedule draws the same progress bar down its departure
	/// times, so it has the same question to answer as the route above: whether
	/// the bar and its dots survive the card they are drawn inside.
	func testAStopSchedulePresents() throws {
		TransitScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transit.aLine)
			.openFirstStop()
			.verifyStopScheduleShown()
			.capture("stop schedule")
	}

	/// Every cell in the strip is a shortcut to the same sheet the header opens
	/// -- a stop cell is no longer its own destination.
	func testAStripCellOpensTheTimetable() throws {
		TransitScreen(app: app)
			.navigate()
			.openTimetableFromStrip(TestIdentifiers.Transit.aStop)
			.verifyTimetableShown()
			.capture("Transit - timetable from strip")
	}

	/// Picking a day from the sheet's navigation bar has to redraw the
	/// timetable beneath it, not just relabel the menu. The frozen clock is a
	/// Saturday, which Express Bus runs, and it does not run on Sunday, so the
	/// rows giving way to the empty state is the proof.
	func testPickingADayRedrawsTheTimetable() throws {
		TransitScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transit.aLine)
			.verifyStopListsDepartures(TestIdentifiers.Transit.aStopOnEveryRunningDay)
			.pickDay(TestIdentifiers.Transit.aDay)
			.capture("Transit - Sunday schedule")
			.verifyLineNotRunning(on: TestIdentifiers.Transit.aDay)
	}
}
