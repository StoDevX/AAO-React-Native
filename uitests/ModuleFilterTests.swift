import XCTest

/// Covers `@frogpond/filter` on a device, which is the only place its answers
/// exist: every one of these assertions is about a native control's state,
/// hit target, or presentation, and Jest can see none of those.
///
/// Menus is the vehicle: Treeline Commons, whose menu is Wiki Monkeys'
/// fixture, so its stations are fixed rather than whatever is being served
/// today. Stations asks for a menu outright, so its count does not decide its
/// shape.
/// Tags: campus:example.college
class ModuleFilterTests: UITestCaseUnbooted {
	override class var campus: Campus? { .example }

	private typealias Keys = TestIdentifiers.Filter.MenusKeys

	// MARK: - The menu

	/// The menu's two kinds of trigger, one after the other: a toggle, then a
	/// menu.
	///
	/// A toggle has one state to change, so its trigger is the control: the tap
	/// flips it where it stands. Nothing is presented, which is the half Jest
	/// cannot see -- a mocked render cannot tell a control that changed state
	/// from one that opened a menu over the screen. It is flipped back before
	/// the menu, so Specials Only is as the menu opened with it.
	///
	/// Then the other presentation: open the pull-down menu and tick two
	/// stations in one opening. The trigger then reads as selected, which it
	/// takes from the filter state, so the ticks reached it.
	func testTheToggleFlipsInPlaceAndTheMenuTakesTwoStations() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.revealFilters()

		let menus = MenusScreen(app: app)
		let filters = FilterScreen(app: app)
		let pizza = TestIdentifiers.Menus.pizzaStation

		// The toggle is built on; a meal with no specials of its own would
		// force it off and grey it out. Treeline Commons' Lunch has them.
		filters.verifyTrigger(Keys.specials, isSelected: true)

		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: false)

		// Nothing was presented over the screen: the menu behind the toolbar is
		// still there to be touched. A menu or sheet would be covering it.
		menus.verifyItemUncovered(TestIdentifiers.Menus.pizzaItem)

		// And it flips back, so the control is a toggle rather than a latch.
		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: true)

		filters.verifyTrigger(Keys.stations, isSelected: false)

		// Nothing starts selected, which shows every station. The menu stays
		// open as options are ticked -- that is what lets several stations be
		// chosen at once -- so the second station is ticked without reopening
		// it, which cannot work unless the menu survived the first tick: the
		// tick that flips the filter from off to on, and so the one at risk.
		let specialty = TestIdentifiers.Menus.specialtyPizzaStation
		filters
			.openFilter(Keys.stations, until: filters.menuItem(pizza))
			.tapMenuItem(pizza)
			.tapMenuItem(specialty)
			.dismissMenu(waitingFor: specialty)

		filters.verifyTrigger(Keys.stations, isSelected: true)
	}
}
