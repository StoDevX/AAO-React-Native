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
class ModuleFilterTests: UITestCase {
	private typealias Keys = TestIdentifiers.Filter.MenusKeys

	// MARK: - The active trigger

	/// A trigger has to say which state it is in, in both directions. The
	/// prominent tint that says it visually is invisible to XCUITest; the
	/// `isSelected` trait set alongside it is not, and the two are written
	/// together so neither can be lost on its own.
	func testTriggerAnnouncesWhetherItsFilterNarrowsAnything() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let filters = FilterScreen(app: app)

		// Nothing is chosen yet, so this filter narrows nothing.
		filters.verifyTrigger(Keys.dietaryRestrictions, isSelected: false)

		filters
			.openFilter(
				Keys.dietaryRestrictions,
				until: filters.option(TestIdentifiers.Menus.vegan)
			)
			.tapOption(TestIdentifiers.Menus.vegan)
			.dismissSheet(waitingFor: TestIdentifiers.Menus.vegan)

		filters.verifyTrigger(Keys.dietaryRestrictions, isSelected: true)
	}

	// MARK: - The sheet

	/// A sheet's taps accumulate in its own state and are handed over once, on
	/// dismissal. This is the round trip that has to survive: choose a row,
	/// close the sheet, open it again, and find the choice still drawn -- and
	/// the rows nobody touched still unchecked.
	func testSheetSelectionSurvivesDismissAndReopen() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let filters = FilterScreen(app: app)
		let vegan = TestIdentifiers.Menus.vegan

		filters
			.openFilter(Keys.dietaryRestrictions, until: filters.option(vegan))
			.verifyOption(vegan, isSelected: false)
			.tapOption(vegan)
			.verifyOption(vegan, isSelected: true)
			.dismissSheet(waitingFor: vegan)

		filters
			.openFilter(Keys.dietaryRestrictions, until: filters.option(vegan))
			.verifyOption(vegan, isSelected: true)
			.verifyOption(TestIdentifiers.Menus.halal, isSelected: false)
	}

	/// The sheet has two dismissals -- the header's Done button and a swipe
	/// down -- and the swipe is the one no code of ours runs: UIKit takes it,
	/// and the selection is handed over only if the sheet's own dismissal
	/// callback fires. Jest covers what Done commits; nothing but a device
	/// covers this. This asserts the visible consequence rather than the
	/// trigger's state: after the swipe, every food row still on screen
	/// carries the cor-icon that was chosen.
	func testSwipeDismissalAppliesTheSelection() throws {
		let menus = MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let filters = FilterScreen(app: app)
		let vegan = TestIdentifiers.Menus.vegan

		// Specials Only applies itself whenever the meal carries a special, and
		// Stav's breakfast can carry a single one that is not vegan -- leaving
		// the menu empty once the vegan filter lands, for a reason that is
		// about the day's food rather than about the swipe. Clearing it runs
		// the swipe against the whole meal, which always has vegan dishes.
		filters.clearTrigger(Keys.specials)

		// The unfiltered menu states the case this test would not otherwise
		// distinguish from success: rows that do not carry the icon exist
		// right now, and the swipe is what has to remove them.
		XCTAssertGreaterThan(
			app.foodRows(withoutDietaryLabel: vegan).count, 0,
			"the unfiltered menu should show rows that are not \(vegan)")

		filters
			.openFilter(Keys.dietaryRestrictions, until: filters.option(vegan))
			.tapOption(vegan)
			.dismissSheet(waitingFor: vegan)

		menus.verifyFoodRowsAppear()
		XCTAssertEqual(
			app.foodRows(withoutDietaryLabel: vegan).count, 0,
			"every remaining row should carry the \(vegan) icon")
	}

	/// The other dismissal: the header's Done button. It runs `onClose`, which
	/// commits the sheet's accumulated selection the same way an interactive
	/// dismissal does -- a Done that only closed the sheet would throw the
	/// reader's choices away, silently and every time.
	///
	/// The trigger's state is the assertion rather than the remaining food
	/// rows: `testSwipeDismissalAppliesTheSelection` already establishes that a
	/// committed selection narrows the menu, so what is left to prove here is
	/// that the button committed anything at all -- and that holds whatever
	/// Stav is serving today.
	func testDonePressAppliesTheSelection() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let filters = FilterScreen(app: app)
		let vegan = TestIdentifiers.Menus.vegan

		filters.verifyTrigger(Keys.dietaryRestrictions, isSelected: false)

		filters
			.openFilter(Keys.dietaryRestrictions, until: filters.option(vegan))
			.tapOption(vegan)
			.tapDone(waitingFor: vegan)

		filters.verifyTrigger(Keys.dietaryRestrictions, isSelected: true)

		// And the choice is still drawn when the sheet comes back up, so Done
		// committed it rather than merely leaving the trigger looking active.
		filters
			.openFilter(Keys.dietaryRestrictions, until: filters.option(vegan))
			.verifyOption(vegan, isSelected: true)
	}

	// MARK: - The menu

	/// The other presentation, end to end: open the pull-down menu, toggle one
	/// A toggle has one state to change, so its trigger is the control: the tap
	/// flips it where it stands. Nothing is presented, which is the half Jest
	/// cannot see -- a mocked render cannot tell a control that changed state
	/// from one that opened a menu over the screen.
	func testTogglingAFilterInPlacePresentsNothing() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.openCafe(TestIdentifiers.Menus.pause)

		let filters = FilterScreen(app: app)

		// The Pause serves specials, so the toggle is seeded on.
		filters.verifyTrigger(Keys.specials, isSelected: true)

		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: false)

		// Nothing was presented over the screen: the menu behind the toolbar is
		// still there to be touched. A menu or sheet would be covering it.
		let row = app.buttons[TestIdentifiers.Menus.pizzaItem]
		XCTAssertTrue(row.waitForExistence(timeout: 30), "the menu should still be on screen")
		XCTAssertTrue(row.isHittable, "nothing should have been presented over the menu")

		// And it flips back, so the control is a toggle rather than a latch.
		filters.tapTrigger(Keys.specials)
		filters.verifyTrigger(Keys.specials, isSelected: true)
	}

	/// The point of a menu that stays open: several options chosen in one
	/// opening. The second station is ticked without reopening the menu, so
	/// this cannot pass unless the menu survived the first tick -- the tick
	/// that flips the filter from off to on, and so the one at risk.
	func testMenuSelectsSeveralOptionsInOneOpening() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.openCafe(TestIdentifiers.Menus.pause)

		let filters = FilterScreen(app: app)
		let pizza = TestIdentifiers.Menus.pizzaStation
		let specialty = TestIdentifiers.Menus.specialtyPizzaStation

		filters
			.openFilter(Keys.stations, until: filters.menuItem(pizza))
			.tapMenuItem(pizza)
			.tapMenuItem(specialty)
			.dismissMenu(waitingFor: specialty)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.pizzaItem].waitForExistence(timeout: 30),
			"the first station's items should show")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitForExistence(timeout: 30),
			"the second station's items should show, chosen without reopening the menu")
	}

	/// station, and find it applied to the list behind the menu. The sheet tests
	/// prove a selection survives dismissal; this one proves a selection made
	/// through the other presentation actually reaches the data.
	func testStationSelectionNarrowsTheFoodList() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.openCafe(TestIdentifiers.Menus.pause)

		let filters = FilterScreen(app: app)
		let pizza = TestIdentifiers.Menus.pizzaStation

		filters.verifyTrigger(Keys.stations, isSelected: false)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitForExistence(timeout: 30),
			"the unfiltered menu should show an item from another station")

		// Nothing starts selected, which shows every station. Ticking one is
		// what narrows the list to it. The menu stays open afterwards -- that is
		// what lets several stations be chosen at once -- so it has to be
		// dismissed before the list behind it can be read.
		filters
			.openFilter(Keys.stations, until: filters.menuItem(pizza))
			.tapMenuItem(pizza)
			.dismissMenu(waitingFor: pizza)

		filters.verifyTrigger(Keys.stations, isSelected: true)

		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.pizzaItem].waitForExistence(timeout: 30),
			"the chosen station's items should stay")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.Menus.specialtyPizzaItem].waitForNonExistence(timeout: 30),
			"the other stations' items should be gone")
		XCTAssertFalse(
			app.staticTexts[TestIdentifiers.Menus.specialtyPizzaStation].exists,
			"the other stations' headers should be gone")
	}
}
