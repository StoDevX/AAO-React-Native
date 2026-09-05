import XCTest

struct DirectoryScreen: Screen {
	let app: XCUIApplication

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.directory)
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Directory should offer a search field")
		searchField.tap()
		searchField.typeText(text)

		// The field is the one place the typed text is held, so read it back
		// before going on: a test that swiped away from an empty field would
		// pass no matter what the swipe did to it.
		XCTAssertEqual(
			searchField.value as? String, text,
			"Typing should put the query in the search field")
		return self
	}

	@discardableResult
	func verifySearchText(_ text: String) -> Self {
		let field = searchField
		let predicate = NSPredicate(format: "value == %@", text)
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: predicate, object: field)],
			timeout: 10)
		XCTAssertEqual(
			settled, .completed,
			"Search field should still read \(text), but reads "
				+ "\(field.value as? String ?? "nothing")")
		return self
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
