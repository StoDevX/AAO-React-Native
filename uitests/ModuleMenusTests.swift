import XCTest

class ModuleMenusTests: UITestCase {
	// MARK: - Navigation and the header

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
}
