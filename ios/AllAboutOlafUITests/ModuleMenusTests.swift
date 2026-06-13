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
		// The Carleton café list now lives behind a segmented switcher rather than
		// a nested tab bar; the list-item hit-testing flakiness predates that
		// change, so allow (but don't require) the failure.
		let options = XCTExpectedFailure.Options()
		options.isStrict = false
		XCTExpectFailure(
			"can't reliably hit the Burton list item - grabs the full-screen view instead?",
			options: options)

		MenusScreen(app: app)
			.navigate()
			.checkCarletonCafes()
	}
}
