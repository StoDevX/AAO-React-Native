import XCTest

class ModuleCalendarTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyCalendarTitle()
	}

	func testCategoryPickerOffersCategories() throws {
		CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.checkCategoriesListed()
			.capture("35-category-submenu")
	}

	/// Selecting a category filters the list; selecting it again clears the filter.
	/// The menu stays open between taps so the user can see the toggle change.
	func testSelectingCategoryFiltersEvents() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.capture("01-calendar-list-default")
			.openPicker()
			.capture("02-picker-open")

		screen.selectCategory(TestIdentifiers.Calendar.categories[0])

		let stayedOpen = screen.pickerIsPresented()
		XCTContext.runActivity(
			named: stayedOpen
				? "Menu stayed presented after selecting category"
				: "Menu closed after selecting category"
		) { _ in }
		screen.capture("03-after-selecting-category")

		if stayedOpen {
			screen
				.verifySelected(TestIdentifiers.Calendar.categories[0])
				.capture("04-category-selected")
		}

		screen.dismissMenu()
		screen.capture("05-list-filtered")
	}

	/// The category filter button floats over the end of the list, so the list
	/// has to be inset for it. Scrolled all the way down, the last row should
	/// sit above the button rather than behind it.
	func testBottomBarClearsTheEndOfTheList() throws {
		CalendarScreen(app: app)
			.navigate()
			.capture("15-list-bottom-bar")
			.scrollToEnd()
			.capture("16-list-scrolled-to-end")
			.verifyLastRowClearsToolbar()
	}

	/// The detail screen for an event opened out of the list: its masthead bar
	/// should carry the calendar's color.
	func testEventDetailFromList() throws {
		CalendarScreen(app: app)
			.navigate()
			.openFirstEvent()
			.capture("09-event-detail-masthead")
	}

	// MARK: - Day picker strip

	/// The strip leads with Sunday — the leftmost cell is Sunday of the current
	/// week, not today.
	func testDayPickerStripLeadsWithSunday() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyStripIsPresent()
			.verifySundayLeadsTheStrip()
			.capture("21-day-picker-strip")
	}

	/// Nothing in Jest can measure a rendered frame, so this is the only place
	/// the cells are checked against the 44pt minimum.
	func testDayCellsMeetTheMinimumTapTarget() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyDayCellsAreTappable()
	}

	/// Swiping the strip settles on a week boundary: the Sunday of whichever week
	/// it lands on comes to rest at the same leading edge, with no partial week
	/// behind it.
	///
	/// The last week is the one that matters. It only reaches the leading edge
	/// because of the trailing scroll inset -- without it the strip runs out of
	/// content and the week comes to rest short, still showing a Sunday but not
	/// at the edge. Hence measuring where the Sunday lands rather than only
	/// which day it is. Neither the inset nor the snap offsets are visible to
	/// Jest: a strip rendered there has no layout pass and no scroll view.
	func testSwipingTheStripSettlesOnASunday() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.verifySundayLeadsTheStrip()

		screen
			.swipeStripToNextWeek()
			.verifySundayLeadsTheStrip(weeksOn: 1)
			.capture("24-strip-second-week")

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

	/// The strip runs to the Saturday of the last event's week, so its final
	/// days can have no events behind them. Tapping one still has to move the
	/// selection somewhere the list can show, rather than selecting a day no
	/// section answers to and leaving the strip fighting itself.
	///
	/// The fixture's last event is Fri 2026-09-18, which leaves Sat 2026-09-19
	/// empty.
	///
	/// The fixture states its events in campus time, but the app reads them in
	/// the device's, so which day the last one falls on moves with the zone. Its
	/// events are timed to keep Friday's on Friday from UTC-8 through UTC+2,
	/// which covers a CI runner (UTC) and a machine on campus alike. Further
	/// east than that they cross midnight, Saturday stops being empty, and this
	/// test has nothing left to check -- so keep the fixture's last day well
	/// clear of midnight if you move it.
	func testTappingADayPastTheLastEventSelectsTheLastDayWithOne() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.verifyStripIsPresent()

		screen.swipeStripToNextWeek().swipeStripToNextWeek()

		screen
			.tapDay("2026-09-19")
			.verifySelectedDay(
				TestIdentifiers.Calendar.dayCellPrefix + "2026-09-18",
				message: "Tapping the empty Saturday should select the last day that has events")
			.capture("26-strip-trailing-day")
	}

	/// Scrolling the list moves the strip's selection to whichever day the list
	/// settled on. The two views drive each other, so this is the direction that
	/// a naive fix breaks first.
	func testScrollingTheListMovesTheStripSelection() throws {
		let screen = CalendarScreen(app: app).navigate()
		screen.verifyStripIsPresent()

		// Scroll once to trigger an initial selection sync.
		screen.nudgeList()

		guard let startingDay = screen.selectedDay() else {
			XCTFail("A day should be selected after the first scroll")
			return
		}
		screen.capture("22-after-first-scroll")

		for _ in 1...4 {
			screen.nudgeList()
		}
		screen.capture("23-after-more-scrolling")

		// Without this the assertion below could pass on a list too short to
		// have scrolled anywhere.
		XCTAssertNotEqual(
			screen.selectedDay(), startingDay,
			"Scrolling the list should move the strip's selection off \(startingDay)")
	}

	/// Today returns the list to the top from wherever it has been scrolled.
	///
	/// The button aimed at an `Ongoing` section that only exists while some
	/// event spans today, so on a day with nothing ongoing it silently scrolled
	/// nowhere. It aims at the first section rendered now, which always exists.
	func testTodayReturnsTheListToTheTop() throws {
		let screen = CalendarScreen(app: app).navigate()
		screen.verifyStripIsPresent()

		guard let topAtLaunch = screen.topRowLabel() else {
			XCTFail("The list should have rows to scroll")
			return
		}

		for _ in 1...6 {
			screen.nudgeList()
		}
		screen.capture("24-scrolled-away-from-today")

		// The list has to have actually moved, or tapping Today proves nothing.
		XCTAssertNotEqual(
			screen.topRowLabel(), topAtLaunch,
			"The list should have scrolled before Today is tested")

		screen.tapToday()
		screen.capture("25-after-tapping-today")

		XCTAssertEqual(
			screen.topRowLabel(), topAtLaunch,
			"Today should return the list to the row it started on")
	}

	/// The add-to-calendar action is a bottom-bar item, which no component test
	/// can reach -- so this is the only assertion that it exists at all.
	func testEventDetailOffersAddToCalendar() throws {
		CalendarScreen(app: app)
			.navigate()
			.openFirstEvent()
			.verifyAddToCalendarButton()
			.capture("17-event-detail-add-to-calendar")
	}

	/// The sheet's bottom bar has to survive being reopened. react-native-screens
	/// reuses one navigation controller for every presentation of a modal, so a
	/// screen that leaves its toolbar showing on the way out makes the next
	/// screen's unhide a no-op -- and that screen's bar items never reach the
	/// bar, leaving the button drawn but untitled. It looked fine the first time
	/// and blank every time after, which is why one presentation never caught it.
	func testAddToCalendarSurvivesReopeningTheSheet() throws {
		let screen = CalendarScreen(app: app).navigate()

		screen.openFirstEvent().verifyAddToCalendarButton().closeEventDetail()

		screen.openFirstEvent().capture("18-add-to-calendar-after-reopening")
		screen.verifyAddToCalendarButton()
	}

	/// The picker is three lists in one: which calendars contribute events, and
	/// a row per axis the list can be narrowed along. SwiftUI renders a Menu's
	/// contents bottom-to-top, so only a screenshot settles the order they
	/// actually reach the screen in.
	func testPickerMenuShowsItsRows() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.verifyMenuSection(TestIdentifiers.Calendar.calendarsSection)

		for row in [
			TestIdentifiers.Calendar.categoryMenu, TestIdentifiers.Calendar.organizationMenu,
		] {
			XCTAssertTrue(
				app.buttons[row].waitForExistence(timeout: 30),
				"\(row) should be a row of the open picker")
		}

		screen.capture("30-picker-rows")
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
			.dismissMenu()
			.capture("31-no-calendars-enabled")

		XCTAssertEqual(
			screen.visibleRowCount(), 0,
			"With no calendar enabled the list should have no rows")

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

		screen
			.openPicker()
			.capture("36-reset-filters-offered")
			.tapResetFilters()
			.capture("32-filter-cleared")

		XCTAssertEqual(
			screen.visibleRowCount(), unfiltered,
			"Reset Filters should restore the whole list")
	}

	/// Reset Filters is an undo, so it has nothing to offer an unfiltered list.
	func testResetFiltersIsAbsentWhileUnfiltered() throws {
		CalendarScreen(app: app).navigate().openPicker()

		XCTAssertFalse(
			app.buttons[TestIdentifiers.Calendar.resetFilters].exists,
			"Reset Filters should be absent while the list is unfiltered")
	}

	/// Organisation is the second filter axis, and the only one whose values
	/// come from Presence rather than from the campus calendar. Nothing in Jest
	/// reaches the rendered menu, so this is the only check that choosing one
	/// narrows the list the way a category does.
	func testFilteringByOrganizationNarrowsTheList() throws {
		let screen = CalendarScreen(app: app).navigate()
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

		screen
			.openPicker()
			.tapResetFilters()

		XCTAssertEqual(
			screen.visibleRowCount(), unfiltered,
			"Reset Filters should restore the whole list")
	}

	/// The list merges several calendars and so credits none of them; the
	/// detail screen credits the one its event came from.
	func testAttributionOnlyOnTheDetailScreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyNoAttribution()
			.openFirstEvent()
			.verifyAttributionOnDetail()
			.capture("33-detail-attribution")
	}
}
