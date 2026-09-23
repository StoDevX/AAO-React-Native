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

	/// The icon grows with the text, so at an accessibility size it is far
	/// taller than at the default one -- and its card has to grow to hold it.
	func testTileIconsStayInsideTheirCardsAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tile icons at an accessibility text size")
			.checkTileIconsStayInsideTheirCards()
	}

	/// The icon box was measured at the default size, so the icon fits there.
	func testTileIconsStayInsideTheirCards() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.checkTileIconsStayInsideTheirCards()
	}
}
