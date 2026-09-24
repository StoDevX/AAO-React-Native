import XCTest

struct NewsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.news)
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
