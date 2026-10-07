import XCTest

struct CourseCatalogScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Course Catalog"]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/course-search", mountedWhen: mounted)
	}

	@discardableResult
	func verifyCourseCatalogTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.courseCatalog)
	}

	@discardableResult
	func checkRecentSectionExists() -> Self {
		let recent = app.staticTexts[TestIdentifiers.CourseCatalog.recent].firstMatch
		XCTAssertTrue(
			recent.existsOrAppears(within: 30),
			"Recent section should be visible")
		return self
	}
}
