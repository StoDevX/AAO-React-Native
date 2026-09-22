import XCTest

class ModuleTransportationTests: UITestCase {
	/// Every line gets a widget, so the screen answers "what is running" without
	/// a tap -- except one the feed has retired, which keeps its entry for
	/// released app versions to read and earns no widget here. Both halves ride
	/// one cold launch; the absence sweep goes last because it scrolls the list
	/// to the bottom.
	func testEveryLineHasAWidget() throws {
		TransportationScreen(app: app)
			.navigate()
			.verifyLineWidgetShown(TestIdentifiers.Transportation.aLine)
			.verifyLineWidgetShown("Red Line")
			.capture("Transportation - widgets")
			.verifyLineWidgetAbsent(TestIdentifiers.Transportation.aHiddenLine)
	}

	/// The strip is a horizontal scroll view inside a list row, which is the
	/// arrangement most likely to have the list steal the gesture.
	func testTheStopStripScrollsSideways() throws {
		TransportationScreen(app: app)
			.navigate()
			.verifyStripHasNotReached(TestIdentifiers.Transportation.aStopFartherAlongTheRoute)
			.swipeStripLeft()
			.verifyStripAdvancedTo(TestIdentifiers.Transportation.aStopFartherAlongTheRoute)
			.capture("Transportation - strip scrolled")
	}

	/// A single stop's schedule draws the same progress bar down its departure
	/// times, so it has the same question to answer as the route above: whether
	/// the bar and its dots survive the card they are drawn inside.
	func testAStopSchedulePresents() throws {
		TransportationScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transportation.aLine)
			.openFirstStop()
			.verifyStopScheduleShown()
			.capture("stop schedule")
	}

	/// Every cell in the strip is a shortcut to the same sheet the header opens
	/// -- a stop cell is no longer its own destination.
	func testAStripCellOpensTheTimetable() throws {
		TransportationScreen(app: app)
			.navigate()
			.openTimetableFromStrip(TestIdentifiers.Transportation.aStop)
			.verifyTimetableShown()
			.capture("Transportation - timetable from strip")
	}

	/// Picking a day from the sheet's navigation bar has to redraw the
	/// timetable beneath it, not just relabel the menu. The frozen clock is a
	/// Saturday, which Express Bus runs, and it does not run on Sunday, so the
	/// rows giving way to the empty state is the proof.
	func testPickingADayRedrawsTheTimetable() throws {
		TransportationScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transportation.aLine)
			.verifyStopListsDepartures(TestIdentifiers.Transportation.aStopOnEveryRunningDay)
			.pickDay(TestIdentifiers.Transportation.aDay)
			.capture("Transportation - Sunday schedule")
			.verifyLineNotRunning(on: TestIdentifiers.Transportation.aDay)
	}

	/// Other Modes has no tab of its own -- it is a set of sections below the
	/// bus widgets, on the same screen.
	func testOtherModesSitsBelowTheWidgets() throws {
		TransportationScreen(app: app)
			.navigate()
			.scrollToOtherModes()
			.capture("Transportation - Other Modes")
	}
}
