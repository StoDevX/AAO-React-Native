import XCTest

class ModuleHomeTests: UITestCase {
	/// Every tile and every item in Home's ⋯ menu opens its own screen.
	///
	/// The feature tests open their screens by deep link, so this is the one
	/// test that taps the tiles and the menu. One launch covers them all: each
	/// is tapped, its screen checked by an element only that screen draws, and
	/// Back taken to the next.
	///
	/// Tiles are listed in the home screen's order, since the grid is only ever
	/// scrolled down. Balances opens SIS in the browser, so it has no screen to
	/// check.
	///
	/// Dev mode, turned on by a long press on the notice, adds the dev-only
	/// tiles and the Developer tile, which is opened last.
	func testEveryTileOpensItsScreen() throws {
		let home = HomeScreen(app: app)
		// Athletics and Carleton Campus are dev-only tiles.
		home.checkHomescreenExists().longPressNotice().tapEnableDevMode()

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
			.chooseFromHomeMenu(
				nav.feedbackMenuItem,
				opening: app.navigationBars[TestIdentifiers.Support.reportProblemTitle])
			.closeProblemForm()

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
				NewsScreen(app: app, tile: buttons.stOlafNews, title: TestIdentifiers.News.stOlafTitle)
					.mounted
			),
			(buttons.athletics, AthleticsScreen(app: app).mounted),
			(buttons.carletonCampus, HoursScreen(app: app).carletonMounted),
		]
		for (tile, mounted) in tiles {
			home.openTile(tile, expecting: mounted).goBack()
		}

		home.openDeveloper()
	}
}
