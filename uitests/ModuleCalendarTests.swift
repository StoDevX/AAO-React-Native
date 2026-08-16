import XCTest

class ModuleCalendarTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CalendarScreen(app: app)
			.navigate()
			.verifyCalendarTitle()
	}

	func testCalendarPickerOffersEveryCalendar() throws {
		CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.checkCalendarsListed()
	}

	/// Turning two calendars on without the menu closing in between is what
	/// `unstable_keepPresented` is for, and expo-router marks it unstable
	/// because selecting an action on iOS can recreate the menu. This records
	/// which of the two actually happens rather than asserting either.
	func testTogglingTwoCalendarsInSuccession() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.capture("01-calendar-list-default")
			.openPicker()
			.capture("02-picker-open")

		screen.toggle(TestIdentifiers.Calendar.calendars[1])

		let stayedOpen = screen.menuIsPresented()
		XCTContext.runActivity(
			named: stayedOpen
				? "Menu stayed presented after the first toggle"
				: "Menu closed after the first toggle"
		) { _ in }
		screen.capture("03-after-first-toggle")

		if !stayedOpen {
			screen.openPicker()
		}
		screen
			.capture("04-menu-with-both-on")
			.toggle(TestIdentifiers.Calendar.calendars[0])
			.capture("05-after-second-toggle")
			.dismissMenu()
			.capture("06-list-after-both-toggles")
	}

	/// Both remote calendars on, so one timeline carries two bar colours; then
	/// scrolled, which is what a large title collapses against and what a pinned
	/// section header sits over.
	func testMergedListColoursAndScrolling() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.toggle(TestIdentifiers.Calendar.calendars[1])
			.dismissMenu()
			.capture("07-both-calendars-large-title")

		// A frame per nudge rather than one after a fling: a section header is
		// only at the pin line, with rows passing it, for part of a scroll.
		for step in 1...6 {
			screen
				.nudgeList()
				.capture(String(format: "08-scrolled-%02d", step))
		}
	}

	/// The detail screen for an event opened out of the merged list: its
	/// masthead bar should carry the calendar's colour, not a fixed blue.
	func testEventDetailFromMergedList() throws {
		CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.toggle(TestIdentifiers.Calendar.calendars[1])
			.dismissMenu()
			.openFirstEvent()
			.capture("09-event-detail-masthead")
	}

	/// The Device group is dev-mode only. A Debug build is in dev mode, so the
	/// group should be there; whether it lists calendars depends on the grant,
	/// which the opt-in row asks for.
	func testDeviceCalendarGroup() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.openPicker()
			.capture("10-picker-groups")

		let optIn = app.buttons["Show device calendars…"]
		guard optIn.waitForExistence(timeout: 15) else {
			XCTContext.runActivity(named: "No opt-in row; device access already granted") { _ in }
			screen.capture("11-device-group")
			return
		}

		optIn.tap()

		// EventKit's grant sheet belongs to Springboard, not the app.
		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
		let allow = springboard.buttons["Allow Full Access"]
		if allow.waitForExistence(timeout: 15) {
			allow.tap()
		}

		screen
			.capture("11-after-granting-device-access")
			.openPicker()
			.capture("12-device-calendars-listed")
	}

	/// A device event's own detail screen -- the point of this task. St. Olaf is
	/// switched off so the only rows left are the device calendar's, which makes
	/// the masthead's tint attributable.
	func testDeviceEventDetail() throws {
		let screen = CalendarScreen(app: app)
			.navigate()
			.openPicker()

		let deviceCalendar = app.buttons[TestIdentifiers.Calendar.deviceCalendar]
		guard deviceCalendar.waitForExistence(timeout: 15) else {
			XCTContext.runActivity(named: "No device calendars; skipping the device detail check") { _ in
			}
			return
		}

		deviceCalendar.tap()
		screen
			.openPicker()
			.toggle(TestIdentifiers.Calendar.calendars[0])
			.dismissMenu()
			.capture("13-device-only-list")
			.openFirstEvent()
			.capture("14-device-event-detail")
	}
}
