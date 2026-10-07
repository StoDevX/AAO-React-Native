import XCTest

/// Covers `@frogpond/filter` on a device, which is the only place its answers
/// exist: every one of these assertions is about a native control's state,
/// hit target, or presentation, and Jest can see none of those.
///
/// Menus is the vehicle. Stav Hall's Dietary Restrictions filter carries
/// icons, so `filterShape` makes it a sheet however few options it has. The
/// Pause's menu comes from this repository's own `data/pause-menu.yaml`, so its
/// ten stations are fixed rather than whatever is being served today. Stations
/// asks for a menu outright, so its count does not decide its shape.
class ModuleFilterTests: UITestCaseUnbooted {
	private typealias Keys = TestIdentifiers.Filter.MenusKeys

	// MARK: - The menu

	/// The Pause's two kinds of trigger, one after the other: a toggle, then a
	/// menu.
	///
	/// A toggle has one state to change, so its trigger is the control: the tap
	/// flips it where it stands. Nothing is presented, which is the half Jest
	/// cannot see -- a mocked render cannot tell a control that changed state
	/// from one that opened a menu over the screen. It is flipped back before
	/// the menu, so Specials Only is as the Pause left it.
	///
	/// Then the other presentation, end to end: open the pull-down menu, tick
	/// two stations in one opening, then untick one, and find each choice
	/// applied to the list behind the menu. This proves a selection made
	/// through the menu actually reaches the data.
	func testTheToggleFlipsInPlaceAndAStationNarrowsTheList() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.openCafe(TestIdentifiers.Menus.pause)
			.revealFilters()

		let filters = FilterScreen(app: app)
		let pizza = TestIdentifiers.Menus.pizzaStation

		// The toggle is built on; a meal with no specials of its own would
		// force it off and grey it out. The Pause's current meal has them.
		filters.verifyTrigger(Keys.specials, isSelected: true)

		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: false)

		// Nothing was presented over the screen: the menu behind the toolbar is
		// still there to be touched. A menu or sheet would be covering it.
		let row = app.buttons[TestIdentifiers.Menus.pizzaItem]
		XCTAssertTrue(row.waitUntilExists(timeout: 30), "the menu should still be on screen")
		XCTAssertTrue(row.isHittable, "nothing should have been presented over the menu")

		// And it flips back, so the control is a toggle rather than a latch.
		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: true)

		filters.verifyTrigger(Keys.stations, isSelected: false)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitUntilExists(timeout: 30),
			"the unfiltered menu should show an item from another station")

		// Nothing starts selected, which shows every station. The menu stays
		// open as options are ticked -- that is what lets several stations be
		// chosen at once -- so the second station is ticked without reopening
		// it, which cannot work unless the menu survived the first tick: the
		// tick that flips the filter from off to on, and so the one at risk.
		// The menu has to be dismissed before the list behind it can be read.
		let specialty = TestIdentifiers.Menus.specialtyPizzaStation
		filters
			.openFilter(Keys.stations, until: filters.menuItem(pizza))
			.tapMenuItem(pizza)
			.tapMenuItem(specialty)
			.dismissMenu(waitingFor: specialty)

		filters.verifyTrigger(Keys.stations, isSelected: true)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.pizzaItem].waitUntilExists(timeout: 30),
			"the first station's items should show")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitUntilExists(timeout: 30),
			"the second station's items should show, chosen without reopening the menu")

		// Unticking one narrows the list to the station left.
		filters
			.openFilter(Keys.stations, until: filters.menuItem(specialty))
			.tapMenuItem(specialty)
			.dismissMenu(waitingFor: pizza)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.pizzaItem].waitUntilExists(timeout: 30),
			"the chosen station's items should stay")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitUntilGone(timeout: 30),
			"the other stations' items should be gone")
		XCTAssertFalse(
			app.staticTexts[TestIdentifiers.Menus.specialtyPizzaStation].exists,
			"the other stations' headers should be gone")
	}
}
