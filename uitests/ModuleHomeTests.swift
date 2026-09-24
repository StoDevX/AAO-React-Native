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

	/// Cards sit two abreast at the default text size, each icon inside its
	/// card.
	func testTilesSitTwoAbreast() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at the default text size")
			.checkTilesSitTwoAbreast()
			.checkTileIconsStayInsideTheirCards()
	}

	/// At an accessibility text size a card's title has no room beside its
	/// neighbour, so each card takes a row of its own. The icon grows with the
	/// text too, far past its size at the default one, and its card has to
	/// grow to hold it.
	func testTilesStackOnePerRowAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at an accessibility text size")
			.checkTilesStackOnePerRow()
			.checkTileIconsStayInsideTheirCards()
	}
}
