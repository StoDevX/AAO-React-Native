import XCTest

struct NewsScreen: Screen {
	let app: XCUIApplication
	/// The home tile that opens this feed
	let tile: String
	/// The feed's navigation bar title
	let title: String

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: tile)
	}

	@discardableResult
	func verifyTitle() -> Self {
		XCTAssertTrue(
			app.navigationBars[title].waitForExistence(timeout: 10),
			"the navigation bar should read \(title)")
		return self
	}

	@discardableResult
	func verifyNewsRowsAppear() -> Self {
		let row = firstRow()
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"at least one news row should be visible")
		return self
	}

	/// The first story row. A row that opens the browser reads as a link, and
	/// one that opens the reader reads as a button.
	func firstRow() -> XCUIElement {
		let predicate = NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.rowPrefix)
		let link = app.links.matching(predicate).firstMatch
		return link.exists ? link : app.buttons.matching(predicate).firstMatch
	}

	@discardableResult
	func openFirstStory() -> MessStoryScreen {
		let row = app.buttons.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.rowPrefix)
		).firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 30), "a story row should be visible")
		row.tap()
		return MessStoryScreen(app: app)
	}
}
