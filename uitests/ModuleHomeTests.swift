import XCTest

class ModuleHomeTests: UITestCase {
	/// Guards the whole tile being tappable, not just its icon and title.
	func testTileIsTappableAwayFromItsCentre() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.tapTileNearItsEdge(TestIdentifiers.Buttons.stavHall)
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

	/// Tiles sit four abreast at the default text size, each icon inside its
	/// card.
	func testTilesSitFourAbreast() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at the default text size")
			.checkTilesSitFourAbreast()
			.checkTileIconsStayInsideTheirCards()
	}

	/// At an accessibility text size a quarter of the screen leaves a label
	/// no room, so tiles sit two abreast instead. The icon grows with the text
	/// too, far past its size at the default one, and its card has to grow to
	/// hold it.
	func testTilesSitTwoAbreastAtAnAccessibilitySize() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		HomeScreen(app: app)
			.checkHomescreenExists()
			.capture("Home tiles at an accessibility text size")
			.checkTilesSitTwoAbreast()
			.checkTileIconsStayInsideTheirCards()
	}
}
