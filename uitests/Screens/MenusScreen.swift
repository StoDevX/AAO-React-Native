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
		XCTAssertTrue(
			mounted.waitForExistence(timeout: 30),
			"the Filters button should be in the navigation bar")
		mounted.tap()
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
		// The menu presents above the bar rather than inside it. Matched on a
		// prefix: each row now carries the meal over the window it is served
		// in, so its label reads `Dinner, 2:30PM - 6PM` rather than `Dinner`.
		let option = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", meal))
			.firstMatch
		tap(mealPicker(cafe, showing: current), until: option, named: "the meal picker naming \(current)")
		// A native menu item: its tap is UIKit's to deliver, not JavaScript's.
		option.tap()
		return self
	}

	/// The title names `meal`, as it does whichever meal is on screen.
	@discardableResult
	func verifyTitleNames(_ meal: String, at cafe: String) -> Self {
		XCTAssertTrue(
			mealPicker(cafe, showing: meal).waitForExistence(timeout: 30),
			"the title should now name \(meal)")
		return self
	}

	/// A food row, by the identifier the menu gives it, is on screen.
	@discardableResult
	func verifyItemShown(_ item: String) -> Self {
		XCTAssertTrue(app.buttons[item].waitForExistence(timeout: 30), "the menu should list \(item)")
		return self
	}

	/// A food row is on screen with nothing presented over it to stop a touch.
	@discardableResult
	func verifyItemUncovered(_ item: String) -> Self {
		verifyItemShown(item)
		XCTAssertTrue(app.buttons[item].isHittable, "nothing should have been presented over \(item)")
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

	/// Assert `cafe`'s tab is the one showing.
	@discardableResult
	func verifyShowing(_ cafe: String) -> Self {
		let tab = app.tabButton(cafe)
		XCTAssertTrue(tab.waitForExistence(timeout: 30), "\(cafe) tab should be visible")
		XCTAssertTrue(tab.waitForSelected(true), "\(cafe) should be the selected cafe")
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
