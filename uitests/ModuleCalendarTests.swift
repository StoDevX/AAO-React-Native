import XCTest

class ModuleCalendarTests: UITestCase {

	// MARK: - Day picker strip

	/// Day mode as the calendar opens in it, before anything is touched.
	///
	/// The strip leads with Sunday — the leftmost cell is Sunday of the current
	/// week, not today. Day mode is what the calendar opens in, so the strip is
	/// there from the start, already leading with a Sunday.
	///
	/// Nothing in Jest can measure a rendered frame, so this is the only place
	/// the cells are checked against the 44pt minimum.
	///
	/// Reset Filters is an undo, so it has nothing to offer an unfiltered list.
	///
	/// The picker is three lists in one: which calendars contribute events, and a
	/// row per axis the list can be narrowed along. SwiftUI renders a Menu's
	/// contents bottom-to-top, so only a screenshot settles the order they
	/// actually reach the screen in. The category submenu is opened last:
	/// descending into an axis replaces what is on screen, so the top-level rows
	/// have to be read while they are still the thing presented.
	///
	/// Athletics events never reach the Calendar; the Athletics screen lists
	/// games instead. The fixture puts one on the frozen day beside rows that
	/// do show, so its absence means it was hidden rather than not yet built.
	/// Its category leaves the picker too, since choosing it could only empty
	/// the list.
	func testDayModeOpensReadyToUse() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
			.capture("37-athletics-hidden")
			.verifyRowAbsent(TestIdentifiers.Calendar.hiddenAthleticsRow)
			.verifyStripIsPresent()
			.verifySundayLeadsTheStrip()
			.capture("21-day-picker-strip")
			.verifyDayCellsAreTappable()
			.openPicker()
			.verifyMenuSection(TestIdentifiers.Calendar.calendarsSection)

		XCTAssertFalse(
			app.buttons[TestIdentifiers.Calendar.resetFilters].exists,
			"Reset Filters should be absent while the list is unfiltered")

		for row in [
			TestIdentifiers.Calendar.categoryMenu, TestIdentifiers.Calendar.organizationMenu,
		] {
			XCTAssertTrue(
				app.buttons[row].waitForExistence(timeout: 30),
				"\(row) should be a row of the open picker")
		}

		screen.capture("30-picker-rows")

		screen
			.checkCategoriesListed()
			.capture("35-category-submenu")

		let athletics = app.buttons.matching(
			NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.Calendar.hiddenCategory))
		XCTAssertEqual(
			athletics.count, 0,
			"The picker should not offer the \(TestIdentifiers.Calendar.hiddenCategory) category")
	}

	/// Swiping the strip browses: it settles on a week boundary, and it does
	/// not move the selection.
	///
	/// The Sunday of whichever week it lands on comes to rest at the same
	/// leading edge, with no partial week behind it. The last week is the one
	/// that matters. It only reaches the leading edge because of the trailing
	/// scroll inset -- without it the strip runs out of content and the week
	/// comes to rest short, still showing a Sunday but not at the edge. Hence
	/// measuring where the Sunday lands rather than only which day it is.
	/// Neither the inset nor the snap offsets are visible to Jest: a strip
	/// rendered there has no layout pass and no scroll view.
	///
	/// Dragging the strip and choosing a day are the pair of gestures that used
	/// to disagree, so the selection is read either side of the first swipe.
	func testSwipingTheStripSettlesOnASundayAndKeepsTheSelection() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.verifySundayLeadsTheStrip()

		guard let selected = screen.selectedDay() else {
			XCTFail("A day should be selected before dragging the strip")
			return
		}

		screen
			.swipeStripToNextWeek()
			.verifySundayLeadsTheStrip(weeksOn: 1)
			.capture("24-strip-second-week")

		XCTAssertEqual(
			screen.selectedDay(), selected,
			"Scrolling the strip should show another week, not choose a day in it")

		// The resting edge of a snapped week, read off the one week that is
		// certainly reachable, so the last week is measured against the app's own
		// layout rather than against a number written down here.
		guard let edge = screen.leadingDayCellEdge() else {
			XCTFail("The strip should have a visible day cell")
			return
		}

		screen
			.swipeStripToNextWeek()
			.verifySundayLeadsTheStrip(weeksOn: 2, atEdge: edge)
			.capture("25-strip-last-week")
	}

	/// Adding an event goes through the system editor, which runs outside the
	/// app and needs no calendar access -- the app ships no calendar usage
	/// string at all. A permission prompt coming back, or the editor failing to
	/// open from the event sheet, turns this red. It also stands in for the
	/// bottom-bar item's existence, which no component test can reach.
	func testAddingAnEventAsksForNoCalendarAccess() throws {
		CalendarScreen(app: app)
			.navigate()
			.openFirstEvent()
			.tapAddToCalendar()
			.saveInSystemEditor(springboard: XCUIApplication(bundleIdentifier: "com.apple.springboard"))
			.verifyAddedToCalendar()
			.capture("17-event-detail-added-to-calendar")
	}

	/// The CALENDARS section is what makes a source controllable. UI test mode
	/// enables one calendar, so switching it off should leave nothing to draw.
	func testTogglingACalendarOffEmptiesTheList() throws {
		let screen = CalendarScreen(app: app).navigate()

		XCTAssertGreaterThan(
			screen.visibleRowCount(), 0,
			"The fixture calendar should put rows on screen to begin with")

		screen
			.openPicker()
			.toggleCalendar(TestIdentifiers.Calendar.uitestCalendar)

		// With no calendar enabled there is no category and no organisation, so
		// each axis draws an empty Menu -- which SwiftUI draws as no row at all.
		// The picker is still open, and a reading that only knew about the axes
		// would call it closed and leave it covering the list.
		XCTAssertTrue(
			screen.pickerIsPresented(),
			"The picker should still read as open with every calendar switched off")

		screen
			.dismissMenu()
			.capture("31-no-calendars-enabled")

		XCTAssertEqual(
			screen.visibleRowCount(), 0,
			"With no calendar enabled the list should have no rows")
		screen.verifyNoticeVisible(TestIdentifiers.Calendar.noCalendarsNotice)

		screen
			.openPicker()
			.toggleCalendar(TestIdentifiers.Calendar.uitestCalendar)
			.dismissMenu()

		XCTAssertGreaterThan(
			screen.visibleRowCount(), 0,
			"Switching the calendar back on should restore its rows")
	}

	/// Reset Filters clears whichever axis is filtered, and is the only way back
	/// to the whole list without hunting for the selected choice to untick.
	///
	/// Restoration is checked by naming a row the filter excluded and watching
	/// it leave and return, rather than by comparing row counts either side:
	/// the list is a lazy stack, so a count says how far ahead SwiftUI built,
	/// not how many events the list holds.
	func testResetFiltersClearsTheFilter() throws {
		let screen = CalendarScreen(app: app).navigate()
		let unfiltered = screen.visibleRowCount()

		screen
			.openPicker()
			.selectCategory(TestIdentifiers.Calendar.categories[0])
			.dismissMenu()

		XCTAssertLessThan(
			screen.visibleRowCount(), unfiltered,
			"Choosing a category should narrow the list")
		screen.verifyRowAbsent(TestIdentifiers.Calendar.unfilteredDayRow)

		screen
			.openPicker()
			.capture("36-reset-filters-offered")
			.tapResetFilters()
			.capture("32-filter-cleared")

		screen.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
	}

	/// Organisation is the second filter axis, and the only one whose values
	/// come from Presence rather than from the campus calendar. Nothing in Jest
	/// reaches the rendered menu, so this is the only check that choosing one
	/// narrows the list the way a category does.
	///
	/// Upcoming, not Day: the fixture's Music Organizations events all fall on
	/// days other than the frozen one, so Day mode's single day would show none
	/// of them either side of the filter, and "narrows" would have nothing to
	/// prove against. Only the merged list has enough days in view for a
	/// sponsor filter to narrow rather than empty it.
	///
	/// Reset is checked against a named row the filter excluded, for the reason
	/// `testResetFiltersClearsTheFilter` gives.
	///
	/// The view menu is checked on the way in: it offers the two views that
	/// exist, and not the one that does not.
	func testFilteringByOrganizationNarrowsTheUpcomingList() throws {
		let screen = CalendarScreen(app: app)
		screen.navigate()
			.openModeMenu()
			.verifyModeAbsent(TestIdentifiers.Calendar.timelineMode)
			.selectMode(TestIdentifiers.Calendar.upcomingMode)
			.verifyStripAbsent()
		let unfiltered = screen.visibleRowCount()

		screen
			.openPicker()
			.selectOrganization(TestIdentifiers.Calendar.organization)
			.dismissMenu()
			.capture("34-filtered-by-organization")

		let filtered = screen.visibleRowCount()

		XCTAssertLessThan(
			filtered, unfiltered,
			"Choosing an organisation should narrow the list")
		XCTAssertGreaterThan(
			filtered, 0,
			"The organisation sponsors several events, so rows should remain")
		screen.verifyRowAbsent(TestIdentifiers.Calendar.unfilteredUpcomingRow)

		screen
			.openPicker()
			.tapResetFilters()

		screen.verifyRowPresent(TestIdentifiers.Calendar.unfilteredUpcomingRow)
	}

	/// Today, in Day mode, is a different thing from Today in Upcoming: it
	/// chooses a day rather than scrolling a list, and the pager has to be
	/// rebuilt around it. Pressed from a day well ahead, it once left the pager
	/// seeded with a day it had no page for, so the strip showed today selected
	/// over an empty pane -- which is why this asserts an event is on screen and
	/// not merely that the strip moved.
	func testTodayReturnsTheDayViewToToday() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		let opening = calendar.topRowLabel()
		XCTAssertNotNil(opening, "Day mode should open on a day that has events")

		// Far enough ahead that the mounted window has moved off today.
		calendar.swipeStripToNextWeek()
		calendar.tapDay("2026-09-12")

		calendar.tapToday()
		calendar.capture("today-from-a-week-ahead")
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCell(TestIdentifiers.Calendar.frozenNow),
			message: "Today should choose the frozen day")
		XCTAssertEqual(
			calendar.topRowLabel(), opening,
			"Today should bring back the day it opened on, with its events drawn")
	}

	// MARK: - View mode

	/// An empty day is a day you can land on now, so it has to keep the strip.
	///
	/// The fixture's "Fall Semester Orientation" runs 2026-09-01 through
	/// 2026-09-12, and `occursOn` (modules/event-list/days.ts) marks every day
	/// it spans -- so the first day the fixture leaves empty on or after the
	/// frozen Saturday is a fortnight out. Days already gone cannot be chosen
	/// at all, which is why the nearer empty days behind it are no use here.
	func testAnEmptyDayKeepsTheStrip() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		// The first day on or after the frozen one that the fixture leaves empty.
		// Days already gone cannot be chosen at all, so an empty one has to be
		// found ahead -- two weeks out here, which is why the strip is swiped to
		// it first.
		let empty = "2026-09-19"
		calendar.swipeStripToNextWeek()
		calendar.swipeStripToNextWeek()

		XCTAssertFalse(
			calendar.dayHasEvents(empty),
			"\(empty) should carry no events in the fixture calendar")

		calendar.tapDay(empty)
		calendar.capture("empty-day")
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + empty,
			message: "Tapping an empty day should select it rather than skip past it")
		calendar.verifyStripIsPresent()
		calendar.verifyNoticeVisible(TestIdentifiers.Calendar.emptyDayNotice)
	}
}
