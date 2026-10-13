import XCTest

/// Tags: campus:example.college
class ModuleTransitTests: UITestCaseUnbooted {
	/// The strip is a horizontal scroll view inside a list row, which is the
	/// arrangement most likely to have the list steal the gesture.
	///
	/// Every cell in the strip is then a shortcut to the same sheet the header
	/// opens -- a stop cell is not its own destination -- and the press has to
	/// reach it through both the strip and the row around it.
	func testTheStripScrollsAndItsCellsOpenTheTimetable() throws {
		TransitScreen(app: app)
			.navigate()
			.verifyStripHasNotReached(TestIdentifiers.Transit.aStopFartherAlongTheRoute)
			.swipeStripLeft()
			.verifyStripAdvancedTo(TestIdentifiers.Transit.aStopFartherAlongTheRoute)
			.openTimetableFromStrip(TestIdentifiers.Transit.aStopFartherAlongTheRoute)
	}

	/// Picking a day from the sheet's navigation bar has to redraw the
	/// timetable beneath it, not just relabel the menu. The frozen clock is a
	/// Saturday, which the Switchback Shuttle runs, and it does not run on Sunday, so the
	/// rows giving way to the empty state is the proof.
	func testPickingADayRedrawsTheTimetable() throws {
		TransitScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transit.aLine)
			.verifyStopListsDepartures(TestIdentifiers.Transit.aStopOnEveryRunningDay)
			.pickDay(TestIdentifiers.Transit.aDay)
			.verifyLineNotRunning(on: TestIdentifiers.Transit.aDay)
	}
}
