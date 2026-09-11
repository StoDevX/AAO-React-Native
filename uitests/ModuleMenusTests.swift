import XCTest

class ModuleMenusTests: UITestCase {
	// MARK: - Navigation

	func testIsReachableFromHomescreen() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyMenusTitle()
	}

	// MARK: - St. Olaf menus

	func testStOlafMenusCanBeOpened() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.verifyDietaryInfoIsAnnounced()
			.checkStOlafCafes()
	}

	// MARK: - Carleton menus
}
