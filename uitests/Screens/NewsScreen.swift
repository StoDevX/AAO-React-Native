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
		// A story opens in the browser, so its row reads as a link.
		let row = app.links.matching(
			NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.rowPrefix)
		).firstMatch
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"at least one news row should be visible")
		return self
	}
}
