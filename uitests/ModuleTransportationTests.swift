import XCTest

class ModuleTransportationTests: UITestCase {
	/// Every line gets a widget, so the screen answers "what is running" without
	/// a tap.
	func testEveryLineHasAWidget() throws {
		TransportationScreen(app: app)
			.navigate()
			.verifyLineWidgetShown(TestIdentifiers.Transportation.aLine)
			.verifyLineWidgetShown("Red Line")
			.capture("Transportation - widgets")
	}

	/// The strip is a horizontal scroll view inside a list row, which is the
	/// arrangement most likely to have the list steal the gesture.
	func testTheStopStripScrollsSideways() throws {
		TransportationScreen(app: app)
			.navigate()
			.swipeStripLeft(startingAt: TestIdentifiers.Transportation.aStop)
			.verifyStripAdvancedTo(TestIdentifiers.Transportation.aStopFartherAlongTheRoute)
			.capture("Transportation - strip scrolled")
	}

	/// Pressing a widget's header opens the line's full timetable in a sheet.
	func testOpeningALineShowsItsTimetable() throws {
		TransportationScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transportation.aLine)
			.verifyTimetableShown()
			.capture("Transportation - line sheet")
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

	/// A stop cell in the strip is the short way to the same screen.
	func testAStripCellOpensThatStop() throws {
		TransportationScreen(app: app)
			.navigate()
			.openStopFromStrip(TestIdentifiers.Transportation.aStop)
			.verifyStopScheduleShown()
			.capture("Transportation - stop from strip")
	}

	/// The day picker lives in the sheet's navigation bar rather than in the
	/// content, so the section title is the only thing on screen that says
	/// which day is showing. This checks the two stay in step.
	func testPickingADayRetitlesTheSchedule() throws {
		TransportationScreen(app: app)
			.navigate()
			.openLine(TestIdentifiers.Transportation.aLine)
			.pickDay(TestIdentifiers.Transportation.aDay)
			.verifyScheduleShows(day: TestIdentifiers.Transportation.aDay)
			.capture("Transportation - Saturday schedule")
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
