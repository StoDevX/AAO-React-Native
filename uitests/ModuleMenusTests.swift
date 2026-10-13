import XCTest

/// Tags: campus:example.college
class ModuleMenusTests: UITestCaseUnbooted {
	// MARK: - Navigation and the header

	/// The meal picker is the title itself, drawn as a custom view because a
	/// `UIBarButtonItem` cannot carry both a label and a chevron. Jest sees
	/// neither the bar nor the menu it opens, so this is the only place the
	/// round trip exists.
	func testMealPickerSwitchesTheMenu() throws {
		let menus = MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()

		let cafe = TestIdentifiers.Menus.cafe

		menus
			.chooseMeal(
				TestIdentifiers.Menus.otherMeal,
				at: cafe,
				from: TestIdentifiers.Menus.openingMeal
			)
			.verifyFoodRowsAppear()
			.verifyTitleNames(TestIdentifiers.Menus.otherMeal, at: cafe)
	}
}
