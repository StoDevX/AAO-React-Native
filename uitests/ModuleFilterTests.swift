import XCTest

/// Covers `@frogpond/filter` on a device, which is the only place its answers
/// exist: every one of these assertions is about a native control's state,
/// hit target, or presentation, and Jest can see none of those.
///
/// Menus is the vehicle because it draws both presentations at once. Stav
/// Hall's Dietary Restrictions filter carries icons, so `filterShape` makes it
/// a sheet however few options it has; The Pause's menu comes from this
/// repository's own `data/pause-menu.yaml` and offers ten stations, under the
/// count at which a list filter becomes a sheet, so its Stations filter is
/// reliably a menu.
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

	/// Swiping is the only dismissal the sheet offers -- there is no Done
	/// button -- so if an interactive dismissal did not hand the selection
	/// over, a filter sheet could never narrow anything at all. This asserts
	/// the visible consequence rather than the trigger's state: after the
	/// swipe, every food row still on screen carries the cor-icon that was
	/// chosen.
	func testSwipeDismissalAppliesTheSelection() throws {
		let menus = MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let filters = FilterScreen(app: app)
		let vegan = TestIdentifiers.Menus.vegan

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

	// MARK: - The menu

	/// The other presentation, end to end: open the pull-down menu, toggle one
	/// station, and find the menu applied to the list behind it. A menu commits
	/// per item rather than on dismissal, so this is a different path through
	/// the package than the sheet tests take.
	func testMenuSelectionAppliesTheFilter() throws {
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

		// Every station starts selected, so choosing one narrows to it alone.
		filters
			.openFilter(Keys.stations, until: filters.menuItem(pizza))
			.tapMenuItem(pizza)

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
