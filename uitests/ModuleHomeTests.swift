import XCTest

class ModuleHomeTests: UITestCase {
	func testLongPressNoticeTogglesDevMode() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.longPressNotice()
			.tapEnableDevMode()
			.openSettings()
			.checkDeveloperSectionVisible()
	}

	/// Every tile that opens a screen in the app opens its own screen.
	///
	/// The feature tests open their screens by deep link, so this is the one
	/// test that taps the tiles. One launch covers them all: each tile is
	/// tapped, its screen checked by an element only that screen draws, and
	/// Back taken to the next tile.
	///
	/// Listed in the home screen's order, since the grid is only ever scrolled
	/// down. Balances opens SIS in the browser, so it has no screen to check.
	func testEveryTileOpensItsScreen() throws {
		let home = HomeScreen(app: app)
		// Athletics and Carleton Campus are dev-only tiles.
		home.checkHomescreenExists().longPressNotice().tapEnableDevMode()

		let buttons = TestIdentifiers.Buttons.self
		let tiles: [(tile: String, mounted: XCUIElement)] = [
			(buttons.menus, MenusScreen(app: app).mounted),
			(buttons.hours, HoursScreen(app: app).mounted),
			(buttons.calendar, CalendarScreen(app: app).mounted),
			(buttons.directory, DirectoryScreen(app: app).mounted),
			(buttons.streamingMedia, StreamingMediaScreen(app: app).mounted),
			(buttons.olafMessenger, MessFrontPage(app: app).mounted),
			(buttons.map, MapScreen(app: app).mounted),
			(buttons.transit, TransitScreen(app: app).mounted),
			(buttons.dictionary, CampusDictionaryScreen(app: app).mounted),
			(buttons.studentOrgs, StudentOrgsScreen(app: app).mounted),
			(buttons.more, MoreScreen(app: app).mounted),
			(buttons.stoPrint, StoPrintScreen(app: app).mounted),
			(buttons.courseCatalog, CourseCatalogScreen(app: app).mounted),
			(buttons.studentWork, StudentWorkScreen(app: app).mounted),
			(
				buttons.stOlafNews,
				NewsScreen(app: app, tile: buttons.stOlafNews, title: "St. Olaf News").mounted
			),
			(buttons.athletics, AthleticsScreen(app: app).mounted),
			(buttons.carletonCampus, HoursScreen(app: app).carletonMounted),
		]

		// One wait per tile: each wait polls for a second at least, and
		// seventeen tiles add up. Dev mode turning on has already shown that
		// taps reach JavaScript.
		let backButton = app.navigationBars.buttons[TestIdentifiers.Navigation.systemBackButton].firstMatch
		for (tile, mounted) in tiles {
			let button = app.buttons[tile].firstMatch
			home.scrollUntilExists(button)
			button.tap()
			// The Map's sheet can take most of a minute on a loaded runner.
			XCTAssertTrue(mounted.waitForExistence(timeout: 60), "The \(tile) tile should open its own screen")
			backButton.tap()
		}
	}
}
