import XCTest

struct MenusScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.menus)
	}

	@discardableResult
	func verifyMenusTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.menus)
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
