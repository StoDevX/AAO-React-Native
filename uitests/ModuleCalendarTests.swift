import XCTest

class ModuleCalendarDayModeTests: UITestCaseUnbooted {

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
  func testDayModeAndFilters() throws {
		let screen = CalendarScreen(app: app)

    screen.navigate()

    screen.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)

    screen.capture("before filtering")

    let rows = screen.visibleRows()
    let expectation = expectation(for: rows.count >= 1)
    wait(for: [expectation], timeout: 10)
    let unfilteredCount = rows.count

    XCTContext.runActivity(named: "Verify the picker rows") { _ in
      screen.openPicker()
      XCTAssertTrue(
        app.staticTexts[TestIdentifiers.Calendar.calendarsSection].waitForExistence(timeout: 30),
        "\(TestIdentifiers.Calendar.calendarsSection) should be a section of the open menu")

      XCTAssertTrue(
        app.buttons[TestIdentifiers.Calendar.categoryMenu].waitForExistence(timeout: 30),
        "\(TestIdentifiers.Calendar.categoryMenu) should be a row of the open picker")

      XCTAssertTrue(
        app.buttons[TestIdentifiers.Calendar.organizationMenu].waitForExistence(timeout: 30),
        "\(TestIdentifiers.Calendar.organizationMenu) should be a row of the open picker")

      XCTAssertTrue(
        app.buttons[TestIdentifiers.Calendar.resetFilters].waitForNonExistence(timeout: 10),
        "\(TestIdentifiers.Calendar.resetFilters) should be absent while the list is unfiltered")

      screen.capture("30-picker-rows")
      screen.dismissMenu()
    }

    // validate the categories
    screen
      .openPicker()
      .openSubmenu(TestIdentifiers.Calendar.categoryMenu)
      .tapMenuItem(TestIdentifiers.Calendar.categories[0])
      .dismissMenu()
    screen.capture("after filtering")

    XCTAssertLessThan(
      rows.count, unfilteredCount,
      "Choosing a category should narrow the list")
    screen.verifyRowAbsent(TestIdentifiers.Calendar.unfilteredDayRow)

    // clear the filters
    screen
      .openPicker()
      .tapMenuItem(TestIdentifiers.Calendar.resetFilters)
    screen.capture("filters cleared")

    XCTAssertEqual(
      rows.count, unfilteredCount,
      "Clearing the filters should restore the list")
    screen.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
	}

  func testDayPickerStrip() throws {
		let screen = CalendarScreen(app: app)
    screen.navigate()

    let todayDayCell = TestIdentifiers.Calendar.dayCell(TestIdentifiers.Calendar.frozenNow)

    guard let selectedDay = screen.selectedDay() else {
      XCTFail("A day should be selected when the screen opens")
      return
    }

    XCTAssertEqual(selectedDay, todayDayCell)

    screen.verifyStripIsPresent()
    screen.capture("strip-this-week")

    let initialWeekDates = screen.datePickerDayIdentifiers()

    let eventRows = screen.visibleRows()
    let expectation = expectation(for: eventRows.count >= 1)
    wait(for: [expectation], timeout: 10)
    let initialEventCount = eventRows.count
    let initialEventIdentifiers = eventRows.identifiers()

    print(initialEventIdentifiers)

    // swiping the day picker should not, by itself, change the displayed day
    screen.swipeStripToNextWeek()
    screen.capture("strip-next-week")
    XCTAssertEqual(
      screen.selectedDay(), selectedDay,
      "Scrolling the strip should show another week, not choose a day in it")
    XCTAssertNotEqual(
      screen.datePickerDayIdentifiers(), initialWeekDates,
      "The dates in the picker should have changed")
    XCTAssertEqual(
      screen.visibleRows().identifiers(), initialEventIdentifiers,
      "The events in the agenda view should have changed")

    // pushing Today should reset the date picker strip, even if we haven't selected a new date
    screen.tapToday()
    XCTAssertEqual(
      screen.datePickerDayIdentifiers(), initialWeekDates,
      "Today should bring back the day it opened on, with its events drawn")

    // swiping on a day's agenda area should change the displayed events
    // AND highlight the day in the picker
    // TODO: disabled due to auto-swipe bugs
    // eventRows.firstMatch.swipeLeft()
    // screen.capture("strip-tomorrow")
    // XCTAssertNotEqual(
    //   initialEventCount, eventRows.count,
    //   "event count should change between days in the fixture")
    // XCTAssertNotEqual(
    //   screen.selectedDay(), selectedDay,
    //   "Swiping the agenda should switch the selected day in the date strip")

    // swiping the day picker moves a week at a time
    // TODO: test this

    // tapping a date in the day picker should also suffice to show that day's events
    let dayToTap = "2026-09-07"
    screen.tapDay(dayToTap)
    XCTAssertNotEqual(
      initialEventCount, eventRows.count,
      "event count should change between days in the fixture")
    XCTAssertEqual(
      screen.selectedDay(), TestIdentifiers.Calendar.dayCell(dayToTap),
      "Scrolling the strip should show another week, not choose a day in it")
    XCTAssertNotEqual(
      screen.visibleRows().identifiers(), initialEventIdentifiers,
      "The events in the agenda view should have changed")

    // tapping a date with no events in the day picker shows the empty day's empty agenda
    // we need to swipe ahead another week to find an empty day
    screen.swipeStripToNextWeek()

    let empty = "2026-09-19"
    XCTAssertFalse(
      screen.dayHasEvents(empty),
      "\(empty) should carry no events in the fixture calendar")

    screen.tapDay(empty)
    screen.capture("empty-day")
    XCTAssertEqual(
      screen.selectedDay(), TestIdentifiers.Calendar.dayCell(empty),
      "Tapping an empty day should select it rather than skip past it")
    screen.verifyStripIsPresent()
    screen.verifyNoticeVisible(TestIdentifiers.Calendar.emptyDayNotice)

    // pushing Today on a not-today day should move to today
    // (use the fact that we're on next week to also assert that the picker strip
    //  changes weeks with us when we push the Today button)
    screen.tapToday()
    screen.capture("today-from-a-week-ahead")
    XCTAssertEqual(
      screen.selectedDay(), todayDayCell,
      "Today should choose the frozen day")
    XCTAssertEqual(
      screen.datePickerDayIdentifiers(), initialWeekDates,
      "Today should bring back the day it opened on, with its events drawn")
	}

  // TODO: assert that the event detail view opens and closes
}

class ModuleCalendarUpcomingModeTests: UITestCaseUnbooted {
  func testFilteringByOrganizationNarrowsTheUpcomingList() throws {
    let screen = CalendarScreen(app: app)
    screen.navigate()

    screen.openModeMenu()
    screen.verifyModeAbsent(TestIdentifiers.Calendar.timelineMode)
    screen.selectMode(TestIdentifiers.Calendar.upcomingMode)
    screen.verifyStripAbsent()

    let rows = app.buttons.matching(.beginsWith("event-row-"))
    let expectation = expectation(for: rows.count >= 1)
    wait(for: [expectation], timeout: 10)
    let unfiltered = rows.count

    screen
      .openPicker()
      .openSubmenu(TestIdentifiers.Calendar.organizationMenu)
      .tapMenuItem(TestIdentifiers.Calendar.organization)
      .dismissMenu()
      .capture("34-filtered-by-organization")

    let filtered = rows.count

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
}
