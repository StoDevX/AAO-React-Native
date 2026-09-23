import XCTest

class ModuleMenusTests: UITestCase {
	// MARK: - Navigation

	/// Also the opening state of the screen: the header names the cafe and the
	/// day, and the filter row is collapsed behind the navigation bar's button
	/// so a menu opens as food rather than as chrome.
	func testIsReachableFromHomescreen() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyCafeHeader(TestIdentifiers.Menus.stOlafCafes[0], showing: TestIdentifiers.Menus.openingMeal)
			.verifyFilters(visible: false)
			.revealFilters()
			.verifyFilters(visible: true)
	}

	// MARK: - The navigation header

	/// The header belongs to the stack, above all four tabs, so it is the one
	/// piece of this screen a tab switch has to rewrite. Asserting the previous
	/// name is *absent* is the point: the header is only ever late, never
	/// missing, so checking the new name alone would pass while both were up.
	///
	/// The Carleton leg is a chooser, not a menu -- no day and no meal to pick.
	/// Before it published a header of its own it inherited the previous
	/// cafe's, down to a live meal picker that re-filtered a tab the reader
	/// could not see, and `Stack.Screen`'s `setOptions` has no cleanup to undo
	/// it.
	func testHeaderFollowsTheCafeTab() throws {
		let menus = MenusScreen(app: app).navigate()
		let stav = TestIdentifiers.Menus.stOlafCafes[0]

		menus.verifyCafeHeader(stav, showing: TestIdentifiers.Menus.openingMeal)

		// Proves the query the Carleton leg below asserts the *absence* of can
		// match something in the first place. A cafe's title carries a line under
		// its name, so this is where it has to find one; without this the
		// assertion down there would pass just as well against a query that
		// matches nothing at all.
		XCTAssertTrue(
			menus.headerDetailed(stav).exists,
			"a cafe's title should carry a line beneath its name")

		menus
			.openCafe(TestIdentifiers.Menus.pause)
			.verifyHeaderNames(TestIdentifiers.Menus.pause)

		XCTAssertFalse(
			menus.headerTitled(stav).exists,
			"the previous cafe's name should be gone from the header")

		let carleton = app.tabButton(TestIdentifiers.Menus.carleton)
		XCTAssertTrue(carleton.waitForExistence(timeout: 30), "the Carleton tab should be visible")
		carleton.tap()

		XCTAssertTrue(
			menus.headerTitled(TestIdentifiers.Menus.carleton).waitForExistence(timeout: 30),
			"the chooser should name itself Carleton")
		XCTAssertFalse(
			menus.headerTitled(TestIdentifiers.Menus.pause).exists,
			"the chooser should not carry a cafe's name")

		// The title reads as one element carrying the name and the line beneath
		// it, so a chooser with no line to carry is a label that is the name and
		// stops. Asserted as the absence of anything longer rather than as the
		// equality of whichever element a `firstMatch` lands on: the plain
		// `Stack.Screen` title is in the bar too, and it would satisfy an
		// equality check while the line beneath had regressed.
		XCTAssertFalse(
			menus.headerDetailed(TestIdentifiers.Menus.carleton).exists,
			"the chooser shows no single day, so it should carry no line beneath its name")
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

	func testStOlafMenusCanBeOpened() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.verifyDietaryInfoIsAnnounced()
			.checkStOlafCafes()
	}

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

	// MARK: - Carleton menus
}
