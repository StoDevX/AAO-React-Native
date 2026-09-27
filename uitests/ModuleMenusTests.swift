import XCTest

class ModuleMenusTests: UITestCase {
	// MARK: - Navigation and the header

	/// Stav as it opens, and the Pause opened from its own tile after it.
	///
	/// The opening state: the header names the cafe and the day, and the filter
	/// row is collapsed behind the navigation bar's button so a menu opens as
	/// food rather than as chrome.
	///
	/// Each cafe is its own screen, so the Pause leg checks that the header is
	/// the Pause's own. Asserting Stav's name is *absent* is the point: checking
	/// the new name alone would pass while both were up.
	func testOpensOnStavAndEachCafeTitlesItsOwnScreen() throws {
		let stav = TestIdentifiers.Menus.stOlafCafes[0]
		let menus = MenusScreen(app: app)
			.navigate()
			.verifyCafeHeader(stav, showing: TestIdentifiers.Menus.openingMeal)
			.verifyFilters(visible: false)
			.revealFilters()
			.verifyFilters(visible: true)
			.verifyFoodRowsAppear()
			.verifyDietaryInfoIsAnnounced()

		// A cafe's title carries a line under its name.
		XCTAssertTrue(
			menus.headerDetailed(stav).exists,
			"a cafe's title should carry a line beneath its name")

		// The frozen clock sits before the Pause opens for the day, so its title
		// says when it does rather than standing alone over nothing.
		menus
			.openCafe(TestIdentifiers.Menus.pause)
			.verifyHeader(
				TestIdentifiers.Menus.pauseTitle,
				reading: TestIdentifiers.Menus.pauseClosedDetail)

		XCTAssertFalse(
			menus.headerTitled(stav).exists,
			"Stav's name should not be in the Pause's header")
	}

	/// The meal picker is the title itself, drawn as a custom view because a
	/// `UIBarButtonItem` cannot carry both a label and a chevron. Jest sees
	/// neither the bar nor the menu it opens, so this is the only place the
	/// round trip exists.
	func testMealPickerSwitchesTheMenu() throws {
		let menus = MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let stav = TestIdentifiers.Menus.stOlafCafes[0]

		menus
			.chooseMeal(
				TestIdentifiers.Menus.otherMeal,
				at: stav,
				from: TestIdentifiers.Menus.openingMeal
			)
			.verifyFoodRowsAppear()

		// The title names the meal on screen, so the switch shows up in it.
		XCTAssertTrue(
			menus.mealPicker(stav, showing: TestIdentifiers.Menus.otherMeal)
				.waitForExistence(timeout: 30),
			"the title should now name \(TestIdentifiers.Menus.otherMeal)")
	}

	// MARK: - St. Olaf menus

	/// A dish's nutrition opens over the menu as a sheet, like every other
	/// detail in the app, rather than as a page of its own. The Pause is used
	/// because its menu comes from `data/pause-menu.yaml`, so the dish is fixed.
	func testTappingADishPresentsItsNutritionSheet() throws {
		MenusScreen(app: app)
			.navigate()
			.openCafe(TestIdentifiers.Menus.pause)
			.openFoodItem(TestIdentifiers.Menus.pizzaItem)
			.verifyNutritionSheet(titled: "Single Slice")
			.capture("Nutrition sheet for Single Slice at the resting detent")
	}
}
