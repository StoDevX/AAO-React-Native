import XCTest

struct DirectoryScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.directory)
	}

	@discardableResult
	func verifyDirectoryTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.directory)
	}

	@discardableResult
	func checkSearchPromptVisible() -> Self {
		let searchPrompt = app.staticTexts[TestIdentifiers.Directory.searchPrompt].firstMatch
		XCTAssertTrue(
			searchPrompt.waitForExistence(timeout: 30),
			"Search the Directory prompt should be visible")
		return self
	}
}
