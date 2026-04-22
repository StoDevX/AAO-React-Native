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
			.checkStOlafCafes()
	}

	// MARK: - Carleton menus

	func testCarletonMenusCanBeOpened() throws {
		XCTExpectFailure("can't seem to hit the Burton list item - seems to be grabbing the full-screen view instead?")

		MenusScreen(app: app)
			.navigate()
			.checkCarletonCafes()
	}
}
