import XCTest

class ModuleCalendarTests: UITestCase {
	func testCategoryPickerOffersCategories() throws {
		CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.checkCategoriesListed()
			.capture("35-category-submenu")
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

	// MARK: - Day picker strip

	/// The strip leads with Sunday — the leftmost cell is Sunday of the current
	/// week, not today.
	/// Day mode is what the calendar opens in, so the strip is there from the
	/// start, already leading with a Sunday.
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

	/// Today returns the list to the top from wherever it has been scrolled.
	///
	/// The button aimed at an `Ongoing` section that only exists while some
	/// event spans today, so on a day with nothing ongoing it silently scrolled
	/// nowhere. It aims at the first section rendered now, which always exists.
	///
	/// Upcoming, not Day: the strip synchronising with list scroll is gone
	/// (`testScrollingTheListMovesTheStripSelection` and
	/// `testTappingADayPastTheLastEventSelectsTheLastDayWithOne`, both deleted
	/// with it), and Today's own list-scrolling behaviour now only exists in
	/// the sectioned Upcoming view.
	func testTodayReturnsTheUpcomingListToTheTop() throws {
		let screen = CalendarScreen(app: app)
		screen.navigate()
			.openModeMenu()
			.selectMode(TestIdentifiers.Calendar.upcomingMode)
			.verifyStripAbsent()

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
	///
	/// Upcoming, not Day: the fixture's Music Organizations events all fall on
	/// days other than the frozen one, so Day mode's single day would show none
	/// of them either side of the filter, and "narrows" would have nothing to
	/// prove against. Only the merged list has enough days in view for a
	/// sponsor filter to narrow rather than empty it.
	func testFilteringByOrganizationNarrowsTheUpcomingList() throws {
		let screen = CalendarScreen(app: app)
		screen.navigate()
			.openModeMenu()
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

		screen
			.openPicker()
			.tapResetFilters()

		XCTAssertEqual(
			screen.visibleRowCount(), unfiltered,
			"Reset Filters should restore the whole list")
	}

	/// The list merges several calendars and so credits none of them; the
	/// detail screen credits the one its event came from.
	/// Closing the event sheet twice should leave you on the calendar both
	/// times. The close button calls `router.back()`, and on a screen presented
	/// as a sheet that can consume the sheet's own dismissal as well as its
	/// own -- taking the calendar with it and landing on the home screen.
	func testClosingTheEventSheetTwiceStaysOnTheCalendar() throws {
		let screen = CalendarScreen(app: app).navigate()

		screen.openFirstEvent().closeEventDetail()
		screen.openFirstEvent().closeEventDetail()

		screen.capture("closed-the-event-sheet-twice")
		screen.verifyCalendarTitle()
	}

	/// A paged TabView inside a navigation stack is the classic way to lose the
	/// interactive pop gesture: the pager claims the horizontal pan and the edge
	/// swipe never fires. Day mode pages horizontally, so this is the one thing
	/// that has to keep working.
	func testSwipingFromTheLeftEdgeLeavesTheCalendar() throws {
		CalendarScreen(app: app).navigate().verifyStripIsPresent()

		// Started hard against the left edge, where UIKit's screen-edge
		// recogniser lives, and dragged most of the way across so the gesture
		// completes rather than rubber-banding back.
		let edge = app.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.5))
		let across = app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5))
		edge.press(forDuration: 0.05, thenDragTo: across)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Buttons.calendar].waitForExistence(timeout: 30),
			"Swiping from the left edge should land back on the home screen")
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

	func testAttributionOnlyOnTheDetailScreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyNoAttribution()
			.openFirstEvent()
			.verifyAttributionOnDetail()
			.capture("33-detail-attribution")
	}

	// MARK: - View mode

	/// The menu offers the two views that exist, and not the one that does not.
	func testViewMenuOffersDayAndUpcoming() throws {
		CalendarScreen(app: app)
			.navigate()
			.openModeMenu()
			.verifyModeAbsent(TestIdentifiers.Calendar.timelineMode)
			.selectMode(TestIdentifiers.Calendar.upcomingMode)
			.verifyStripAbsent()
	}

	/// Dragging the strip browses; it must not move the selection. This is the
	/// pair of gestures that used to disagree.
	func testDraggingTheStripLeavesTheSelectionAlone() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		guard let before = calendar.selectedDay() else {
			XCTFail("A day should be selected before dragging the strip")
			return
		}
		calendar.swipeStripToNextWeek()

		XCTAssertEqual(
			calendar.selectedDay(), before,
			"Scrolling the strip should show another week, not choose a day in it")
	}

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

	/// Every other test here selects a day with `XCUIElement.tap()`, which can
	/// activate a `Pressable` through the accessibility layer without landing a
	/// real touch where the cell is drawn. A coordinate tap always synthesizes a
	/// touch through UIKit's actual `hitTest(_:with:)`, which is what a finger on
	/// a physical device does -- and reports from a physical iPhone 14 Pro say
	/// that almost never selects a day, even though the strip scrolls fine.
	///
	/// Several targets, in sequence, and one after a scroll: a single tap could
	/// pass by luck on a bug this intermittent, so the loop is what would have
	/// caught a hit-testing problem that only shows up some of the time.
	func testTappingADayCellByCoordinateSelectsIt() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		// Days ahead of the frozen one, since a day already gone cannot be
		// chosen at all.
		calendar.swipeStripToNextWeek()
		for target in ["2026-09-08", "2026-09-10", "2026-09-07", "2026-09-11", "2026-09-09"] {
			calendar.tapDayAtItsCenter(target)
			calendar.verifySelectedDay(
				TestIdentifiers.Calendar.dayCellPrefix + target,
				message: "A coordinate tap on \(target)'s cell should select it, the way a real touch does")
		}

		calendar.swipeStripToNextWeek()
		let afterScroll = "2026-09-14"
		calendar.tapDayAtItsCenter(afterScroll)
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + afterScroll,
			message: "A coordinate tap after scrolling the strip should still select the cell it lands on")
	}
}
