import XCTest

struct CourseCatalogScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.courseCatalog)
	}

	@discardableResult
	func verifyCourseCatalogTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.courseCatalog)
	}

	@discardableResult
	func checkRecentSectionExists() -> Self {
		let recent = app.staticTexts[TestIdentifiers.CourseCatalog.recent].firstMatch
		assertExists(recent, "Recent section should be visible")
		return self
	}
}
