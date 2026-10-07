import XCTest

class ModuleCalendarDayModeTests: UITestCaseUnbooted {

	/// Choosing a category from the toolbar picker narrows the day's list, and
	/// Reset Filters brings it back. The picker is an `@expo/ui` Menu of
	/// Toggles, so this is the round trip from a native menu to the filter
	/// store and back to the list, which Jest's stand-in for the menu cannot
	/// make.
	func testACategoryNarrowsTheListAndResetBringsItBack() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
			.openPicker()
			.openSubmenu(TestIdentifiers.Calendar.categoryMenu)
			.tapMenuItem(TestIdentifiers.Calendar.categories[0])
			.dismissMenu()
			.verifyRowAbsent(TestIdentifiers.Calendar.unfilteredDayRow)
			.openPicker()
			.tapResetFilters()
			.verifyRowPresent(TestIdentifiers.Calendar.unfilteredDayRow)
	}

  func testDayPickerStrip() throws {
		let screen = CalendarScreen(app: app)
    screen.navigate()

    let todayDayCell = TestIdentifiers.Calendar.dayCell(TestIdentifiers.Calendar.frozenNow)

    guard let selectedDay = screen.selectedDay() else {
      XCTFail("A day should be selected when the screen opens")
      return
    }

    XCTAssertEqual(selectedDay, todayDayCell, "The frozen day should be selected when the screen opens")

    screen.verifyStripIsPresent()

    let initialWeekDates = screen.datePickerDayIdentifiers()

    let eventRows = screen.visibleRows()
    let expectation = expectation(for: eventRows.count >= 1)
    wait(for: [expectation], timeout: 10)
    let initialEventIdentifiers = eventRows.identifiers()

    // swiping the day picker should not, by itself, change the displayed day
    screen.swipeStripToNextWeek()
    XCTAssertEqual(
      screen.selectedDay(), selectedDay,
      "Scrolling the strip should show another week, not choose a day in it")
    XCTAssertNotEqual(
      screen.datePickerDayIdentifiers(), initialWeekDates,
      "The dates in the picker should have changed")
    XCTAssertEqual(
      screen.visibleRows().identifiers(), initialEventIdentifiers,
      "Scrolling the strip should leave the agenda on the day it showed")

    // pushing Today should reset the date picker strip, even if we haven't selected a new date
    screen.tapToday()
    screen.verifyStripShows(
      initialWeekDates,
      "Today should bring back the day it opened on, with its events drawn")

    // tapping a date in the day picker should also suffice to show that day's events
    let dayToTap = TestIdentifiers.Calendar.aDayWithEvents
    screen.tapDay(dayToTap)
    XCTAssertEqual(
      screen.selectedDay(), TestIdentifiers.Calendar.dayCell(dayToTap),
      "Tapping a day in the strip should choose it")
    XCTAssertNotEqual(
      screen.visibleRows().identifiers(), initialEventIdentifiers,
      "The events in the agenda view should have changed")

    // tapping a date with no events in the day picker shows the empty day's empty agenda
    // we need to swipe ahead another week to find an empty day
    screen.swipeStripToNextWeek()

    let empty = TestIdentifiers.Calendar.anEmptyDay
    XCTAssertFalse(
      screen.dayHasEvents(empty),
      "\(empty) should carry no events in the fixture calendar")

    screen.tapDay(empty)
    XCTAssertEqual(
      screen.selectedDay(), TestIdentifiers.Calendar.dayCell(empty),
      "Tapping an empty day should select it rather than skip past it")
    screen.verifyStripIsPresent()
    screen.verifyNoticeVisible(TestIdentifiers.Calendar.emptyDayNotice)

    // pushing Today on a not-today day should move to today
    // (use the fact that we're on next week to also assert that the picker strip
    //  changes weeks with us when we push the Today button)
    screen.tapToday()
    XCTAssertEqual(
      screen.selectedDay(), todayDayCell,
      "Today should choose the frozen day")
    screen.verifyStripShows(
      initialWeekDates,
      "Today should bring back the day it opened on, with its events drawn")
	}
}
