import XCTest

struct MenusScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars.buttons[TestIdentifiers.Menus.filtersButton].firstMatch
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/menus", mountedWhen: mounted)
	}

	/// Reveal the filter row, which a menu opens with collapsed behind a
	/// navigation-bar button.
	///
	/// Each cafe keeps its own, so a test that switches cafes reveals them
	/// again on the one it lands on.
	@discardableResult
	func revealFilters() -> Self {
		let button = app.navigationBars.buttons[TestIdentifiers.Menus.filtersButton].firstMatch
		XCTAssertTrue(
			button.waitForExistence(timeout: 30),
			"the Filters button should be in the navigation bar")
		button.tap()
		return self
	}

	/// The title, which doubles as the meal picker's button.
	///
	/// Queried across every element type: the title is a SwiftUI `Menu` label
	/// hosted in the bar, and it surfaces as neither a plain button nor static
	/// text reliably.
	///
	/// Matched on a prefix, since the label ends in the meal's serving window
	/// and that is written in the device's zone -- see `Menus.header`.
	func mealPicker(_ cafe: String, showing meal: String) -> XCUIElement {
		app.navigationBars.descendants(matching: .any)
			.matching(
				NSPredicate(
					format: "label BEGINSWITH %@", TestIdentifiers.Menus.header(cafe, meal: meal))
			)
			.firstMatch
	}

	/// Open the title's menu and choose another meal.
	@discardableResult
	func chooseMeal(_ meal: String, at cafe: String, from current: String) -> Self {
		let picker = mealPicker(cafe, showing: current)
		XCTAssertTrue(
			picker.waitForExistence(timeout: 30),
			"the title should name \(current) and open the meal picker")
		picker.tap()

		// The menu presents above the bar rather than inside it. Matched on a
		// prefix: each row now carries the meal over the window it is served
		// in, so its label reads `Dinner, 2:30PM - 6PM` rather than `Dinner`.
		let option = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", meal))
			.firstMatch
		XCTAssertTrue(
			option.waitForExistence(timeout: 30),
			"\(meal) should be offered in the meal menu")
		option.tap()
		return self
	}

	@discardableResult
	func verifyFoodRowsAppear() -> Self {
		let row = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.Menus.foodRowPrefix)
		).firstMatch
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"at least one food row should be visible")
		return self
	}

	/// Switch to another St. Olaf cafe's tab and wait for its menu to draw.
	@discardableResult
	func openCafe(_ cafe: String) -> Self {
		let tab = app.tabButton(cafe)
		XCTAssertTrue(tab.waitForExistence(timeout: 30), "\(cafe) tab should be visible")
		tab.tap()
		return verifyFoodRowsAppear()
	}
}
