import XCTest

struct MenusScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.menus)
	}

	/// The navigation bar names the cafe and the day and meal it is showing, on
	/// two lines, and that whole title is the meal picker.
	///
	/// Asserted against the title's composed accessibility label rather than
	/// its two halves: the label is ours, and it names the cafe, the day and
	/// the meal in one element. Scoped to `navigationBars` besides, since a
	/// cafe's name is also its tab's label.
	@discardableResult
	func verifyCafeHeader(_ cafe: String, showing meal: String) -> Self {
		XCTAssertTrue(
			mealPicker(cafe, showing: meal).waitForExistence(timeout: 30),
			"the header should read \(cafe) over \(TestIdentifiers.Menus.frozenDate) and \(meal)")
		return self
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

	/// The header names this screen, without saying which meal it is showing.
	///
	/// For a cafe whose meals this suite does not pin down -- The Pause serves
	/// whatever `data/pause-menu.yaml` says, and the Carleton tab is a chooser
	/// with no meal at all.
	@discardableResult
	func verifyHeaderNames(_ name: String) -> Self {
		XCTAssertTrue(
			app.navigationBars.staticTexts[name].waitForExistence(timeout: 30),
			"the header should name \(name)")
		return self
	}

	/// Whether the filter row is on screen, named by one of its triggers.
	@discardableResult
	func verifyFilters(visible: Bool) -> Self {
		let specials = app.buttons[
			TestIdentifiers.Filter.trigger(TestIdentifiers.Filter.MenusKeys.specials)
		].firstMatch

		if visible {
			XCTAssertTrue(
				specials.waitForExistence(timeout: 30),
				"the filter row should be on screen once revealed")
		} else {
			XCTAssertTrue(
				specials.waitForNonExistence(timeout: 30),
				"the filter row should start collapsed")
		}
		return self
	}

	/// The title, which doubles as the meal picker's button.
	///
	/// Queried across every element type: the title is a SwiftUI `Menu` label
	/// hosted in the bar, and it surfaces as neither a plain button nor static
	/// text reliably.
	func mealPicker(_ cafe: String, showing meal: String) -> XCUIElement {
		app.navigationBars.descendants(matching: .any)[
			TestIdentifiers.Menus.header(cafe, meal: meal)
		].firstMatch
	}

	/// Open the title's menu and choose another meal.
	@discardableResult
	func chooseMeal(_ meal: String, at cafe: String, from current: String) -> Self {
		let picker = mealPicker(cafe, showing: current)
		XCTAssertTrue(
			picker.waitForExistence(timeout: 30),
			"the title should name \(current) and open the meal picker")
		picker.tap()

		// The menu presents above the bar rather than inside it.
		let option = app.buttons[meal].firstMatch
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

	/// Proves a food row's label carries a dietary-icon name, not just the item
	/// name and (when present) the "Special" marker -- both of which also
	/// produce a comma, so a bare `label CONTAINS ','` would pass on a plain
	/// specials row with no dietary icon at all. Excluding rows whose label
	/// *ends* with ", Special" rules that case out, since a real cor-icon name
	/// is always appended after it.
	///
	/// `food-row-label.test.ts` covers `foodRowLabel` as a pure function, which
	/// is a different claim: that the string is composed correctly. This one is
	/// that the string reaches a real accessibility element on screen, which
	/// only a device can answer.
	///
	/// This does not prove any icon PNG reached disk: `foodRowLabel` is built
	/// from every cor-icon key the item carries, not from `localIcons`, by
	/// design (`food-item-row.tsx`) -- a VoiceOver user should hear "Gluten
	/// Free" whether or not that download succeeded. Verifying the download
	/// itself is not something an accessibility-label query can do.
	@discardableResult
	func verifyDietaryInfoIsAnnounced() -> Self {
		let labelled = app.buttons.matching(
			NSPredicate(
				format: "identifier BEGINSWITH %@ AND label CONTAINS ',' AND NOT (label ENDSWITH ', Special')",
				TestIdentifiers.Menus.foodRowPrefix)
		).firstMatch
		XCTAssertTrue(
			labelled.waitForExistence(timeout: 30),
			"a food row should announce its dietary icons in its label")
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

	@discardableResult
	func checkStOlafCafes() -> Self {
		for cafe in TestIdentifiers.Menus.stOlafCafes {
			XCTContext.runActivity(named: cafe) { _ in
				let tab = app.tabButton(cafe)
				XCTAssertTrue(
					tab.waitForExistence(timeout: 30),
					"\(cafe) tab should be visible")
				tab.tap()
			}
		}
		return self
	}

	@discardableResult
	func checkCarletonCafes() -> Self {
		let carleton = app.tabButton(TestIdentifiers.Menus.carleton)
		XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		carleton.tap()

		for cafe in TestIdentifiers.Menus.carletonCafes {
			XCTContext.runActivity(named: "open \(cafe)") { _ in
				let menu = app.elementWithLabel(startingWith: cafe)
				XCTAssertTrue(
					menu.waitForExistence(timeout: 30),
					"\(cafe) menu should be visible")
				menu.tap()
			}

			// tab navigator should disappear
			XCTAssertTrue(carleton.waitForNonExistence(timeout: 30))
			// now look for the cafe name in the header
			XCTAssertTrue(
				app.staticTexts[cafe].firstMatch.waitForExistence(timeout: 30),
				"\(cafe) title should be visible")

			// TODO: how to go back? maybe this?
			app.elementWithLabel(startingWith: "Back").tap()

			// and wait for the tab navigator to reappear
			XCTAssertTrue(carleton.waitForExistence(timeout: 30))
		}
		return self
	}
}
