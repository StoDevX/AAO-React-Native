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

		let stayedOpen = screen.menuIsPresented()
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
}
