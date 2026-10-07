import XCTest

/// Every tile and every item in Home's ⋯ menu opens its own screen.
///
/// The feature tests open their screens by deep link, so these are the tests
/// that tap the tiles and the menu. Each item is tapped, its screen checked by
/// an element only that screen draws, and Back taken to the next. The tiles are
/// split in two so that neither test runs long.
class ModuleHomeTests: UITestCase {
	func testEveryHomeMenuItemOpensItsScreen() throws {
		let home = HomeScreen(app: app).checkHomescreenExists()

		let nav = TestIdentifiers.Navigation.self
		let menuItems: [(item: String, mounted: XCUIElement)] = [
			(nav.supportMenuItem, SupportScreen(app: app).host),
			(nav.aboutMenuItem, AboutScreen(app: app).host),
			(nav.contributingMenuItem, ContributingScreen(app: app).host),
		]
		for (item, mounted) in menuItems {
			home.chooseFromHomeMenu(item, opening: mounted).goBack()
		}
		home
			.chooseFromHomeMenu(nav.feedbackMenuItem, opening: home.problemForm)
			.closeProblemForm()
	}

	/// The tiles at the top of the grid, down to Map.
	func testTheUpperTilesOpenTheirScreens() throws {
		let home = HomeScreen(app: app).checkHomescreenExists()
		let buttons = TestIdentifiers.Buttons.self
		openEach(
			[
				(buttons.menus, MenusScreen(app: app).mounted),
				(buttons.hours, HoursScreen(app: app).mounted),
				(buttons.calendar, CalendarScreen(app: app).mounted),
				(buttons.directory, DirectoryScreen(app: app).mounted),
				(buttons.streamingMedia, StreamingMediaScreen(app: app).mounted),
				(buttons.olafMessenger, MessFrontPage(app: app).mounted),
				(buttons.map, MapScreen(app: app).mounted),
			], from: home)
	}

	/// The tiles from Transit down, with the dev-only tiles and the Developer
	/// tile, which is opened last. Balances opens SIS in the browser, so it has
	/// no screen to check.
	///
	/// Dev mode, turned on by a long press on the notice, adds the dev-only
	/// tiles: Athletics and Carleton Campus.
	func testTheLowerTilesOpenTheirScreens() throws {
		let home = HomeScreen(app: app)
		home.checkHomescreenExists().longPressNotice().tapEnableDevMode()

		let buttons = TestIdentifiers.Buttons.self
		openEach(
			[
				(buttons.transit, TransitScreen(app: app).mounted),
				(buttons.dictionary, CampusDictionaryScreen(app: app).mounted),
				(buttons.studentOrgs, StudentOrgsScreen(app: app).mounted),
				(buttons.more, MoreScreen(app: app).mounted),
				(buttons.stoPrint, StoPrintScreen(app: app).mounted),
				(buttons.courseCatalog, CourseCatalogScreen(app: app).mounted),
				(buttons.studentWork, StudentWorkScreen(app: app).mounted),
				(
					buttons.stOlafNews,
					NewsScreen(app: app, tile: buttons.stOlafNews, title: TestIdentifiers.News.stOlafTitle)
						.mounted
				),
				(buttons.athletics, AthleticsScreen(app: app).mounted),
				(buttons.carletonCampus, HoursScreen(app: app).carletonMounted),
			], from: home)

		home.openDeveloper()
	}

	/// Opens each tile in turn and goes back. Tiles are listed in the home
	/// screen's order, since the grid is only ever scrolled down.
	private func openEach(_ tiles: [(tile: String, mounted: XCUIElement)], from home: HomeScreen) {
		for (tile, mounted) in tiles {
			home.openTile(tile, expecting: mounted).goBack()
		}
	}
}
