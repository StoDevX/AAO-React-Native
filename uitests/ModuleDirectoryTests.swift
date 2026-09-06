import XCTest

class ModuleDirectoryTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyDirectoryTitle()
			.verifyContactsHeading()
	}

	/// Every contact in data/contact-info/ gets a tile. The count is the point:
	/// a grid that silently drops the last row still looks right in isolation.
	func testShowsEveryContactBeforeASearch() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyContactTiles(count: 8)
			.capture("Directory contact grid")
	}

	func testTappingAContactOpensItsDetail() throws {
		DirectoryScreen(app: app)
			.navigate()
			.openContact(TestIdentifiers.Directory.aContact)
			.verifyTitle(TestIdentifiers.Directory.aContact)
	}

	func testLongPressingAContactOffersItsAction() throws {
		DirectoryScreen(app: app)
			.navigate()
			.verifyContactMenu(
				for: TestIdentifiers.Directory.aContact,
				offers: TestIdentifiers.Directory.aContactAction)
	}

	/// The search field holds the query and nothing else does, so a swipe back
	/// that is begun and then abandoned has to give it back intact -- otherwise
	/// the reader returns to a list of results with nothing on screen saying
	/// what was searched for.
	func testCancelledSwipeBackKeepsTheQuery() throws {
		DirectoryScreen(app: app)
			.navigate()
			.search(for: "olaf")
			.cancelSwipeBack()
			.verifyDirectoryTitle()
			.capture("Directory after a cancelled swipe back")
			.verifySearchText("olaf")
	}
}
