import XCTest

class ModuleHomeTests: UITestCase {
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

	/// Cards sit two abreast at the default text size.
	func testTilesSitTwoAbreast() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at the default text size")
			.checkTilesSitTwoAbreast()
	}

	/// At an accessibility text size a card's title has no room beside its
	/// neighbour, so each card takes a row of its own.
	func testTilesStackOnePerRowAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at an accessibility text size")
			.checkTilesStackOnePerRow()
	}
}
