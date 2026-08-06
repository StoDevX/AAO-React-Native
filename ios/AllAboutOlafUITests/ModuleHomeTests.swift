import XCTest

class ModuleHomeTests: UITestCase {
	func testShowsTheHomeScreen() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.checkMenusButtonExists()
	}

	/// Guards the whole tile being tappable, not just its icon and title.
	func testTileIsTappableAwayFromItsCentre() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.tapTileNearItsEdge(TestIdentifiers.Buttons.menus)
			.checkHomescreenDismissed()
	}

	func testLongPressNoticeTogglesDevMode() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.longPressNotice()
			.tapEnableDevMode()
			.openSettings()
			.checkDeveloperSectionVisible()
	}
}
