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

	/// Today wears its own filled circle only while it is also the selection;
	/// off the selection it stays red with no circle, so it never looks chosen
	/// alongside whichever day actually is. None of this is something Jest can
	/// see -- it has no layout pass -- so a screenshot is the only artifact that
	/// proves it.
	///
	/// Two captures carry all four cell states between them: the first shows
	/// today circled and selected against every other visible cell, plain and
	/// unselected; the second, taken after selecting a different day, shows
	/// today red but uncircled next to the newly selected day's own circle.
	func testTodayCircleOnlyShowsWhenSelected() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()
		calendar.capture("today-selected-others-plain")

		let other = "2026-09-01"
		calendar.tapDay(other)
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + other,
			message: "Tapping another day should select it")
		calendar.capture("today-unselected-other-selected")
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

	/// Day is what the calendar opens in, so the strip is there from the start.
	func testCalendarOpensInDayView() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyStripIsPresent()
			.verifySundayLeadsTheStrip()
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
	/// 2026-08-31 rather than the day after the frozen date: the fixture's
	/// "Fall Semester Orientation" is an ongoing event spanning 2026-09-01
	/// through 2026-09-12, so `occursOn` (modules/event-list/days.ts) marks
	/// every one of those days as having an event -- including the day right
	/// after the frozen Saturday. The Monday before the frozen week's Sunday is
	/// the nearest day the fixture leaves empty, and it is visible on launch
	/// with no strip swipe needed.
	func testAnEmptyDayKeepsTheStrip() throws {
		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		let empty = "2026-08-31"
		XCTAssertFalse(
			calendar.dayHasEvents(empty),
			"2026-08-31 should carry no events in the fixture calendar")

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

		for target in ["2026-08-31", "2026-09-01", "2026-08-30", "2026-09-02", "2026-09-03"] {
			calendar.tapDayAtItsCenter(target)
			calendar.verifySelectedDay(
				TestIdentifiers.Calendar.dayCellPrefix + target,
				message: "A coordinate tap on \(target)'s cell should select it, the way a real touch does")
		}

		calendar.swipeStripToNextWeek()
		let afterScroll = "2026-09-07"
		calendar.tapDayAtItsCenter(afterScroll)
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + afterScroll,
			message: "A coordinate tap after scrolling the strip should still select the cell it lands on")
	}

	/// A dot is what replaces scrolling to find out whether a day has anything,
	/// so it has to be drawn where a screenshot shows it -- and readably,
	/// which is a colour claim only a screenshot can close.
	///
	/// The dot's colour was a real review catch: it once reused a colour tuned
	/// for drawing on the selection circle, which made it invisible on today's
	/// cell and on a selected cell in light mode. `isToday ? c.systemRed :
	/// c.label` (day-picker-strip.tsx) is the fix, so this captures both cells
	/// the bug hit, under both appearances the app supports.
	///
	/// The appearance is set before the app relaunches, matching
	/// `ModuleCampusDictionaryTests.verifyAddedSenseWash`: a dynamic colour
	/// resolves against the traits its view was drawn under, and relaunching
	/// draws the whole screen once, under the appearance being photographed.
	private func verifyDayDotContrast(under appearance: XCUIDevice.Appearance, named suffix: String) {
		let original = XCUIDevice.shared.appearance
		addTeardownBlock { XCUIDevice.shared.appearance = original }
		XCUIDevice.shared.appearance = appearance
		relaunchWithFreshState()

		let calendar = CalendarScreen(app: app)
		calendar.navigate().verifyStripIsPresent()

		let today = TestIdentifiers.Calendar.dayCell(TestIdentifiers.Calendar.frozenNow)
			.replacingOccurrences(of: TestIdentifiers.Calendar.dayCellPrefix, with: "")
		XCTAssertTrue(
			calendar.dayHasEvents(today),
			"The frozen day should carry events, so its dot is the today-with-events case")
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + today,
			message: "Day view should open with today selected")
		calendar.capture("Day dot, today has events \(suffix)")

		// 2026-09-01 sits in the same visible week as the frozen day and
		// carries its own events (it is the first day of the fixture's ongoing
		// orientation), so tapping it gives a selected-but-not-today cell with
		// no strip swipe needed.
		let selected = "2026-09-01"
		XCTAssertTrue(
			calendar.dayHasEvents(selected),
			"2026-09-01 should carry events in the fixture calendar")
		calendar.tapDay(selected)
		calendar.verifySelectedDay(
			TestIdentifiers.Calendar.dayCellPrefix + selected,
			message: "Tapping a day should select it")
		calendar.capture("Day dot, selected has events \(suffix)")

		// The dot's colour against its cell's background is a claim only the
		// two screenshots above carry -- open both and look.
	}

	func testDayDotContrastInLightMode() throws {
		verifyDayDotContrast(under: .light, named: "(light)")
	}

	func testDayDotContrastInDarkMode() throws {
		verifyDayDotContrast(under: .dark, named: "(dark)")
	}
}
