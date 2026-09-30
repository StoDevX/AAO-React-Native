import XCTest

struct CourseCatalogScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Course Catalog"]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/CourseSearch", mountedWhen: mounted)
	}

	@discardableResult
	func verifyCourseCatalogTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.courseCatalog)
	}

	@discardableResult
	func checkRecentSectionExists() -> Self {
		let recent = app.staticTexts[TestIdentifiers.CourseCatalog.recent].firstMatch
		XCTAssertTrue(
			recent.waitForExistence(timeout: 30),
			"Recent section should be visible")
		return self
	}
}
