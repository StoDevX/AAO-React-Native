import XCTest

struct BuildingHoursScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.buildingHours)
	}

	@discardableResult
	func verifyBuildingHoursTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.buildingHours)
	}

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"Building Hours should offer a search field")
		searchField.tap()
		searchField.typeText(text)
		return self
	}

	@discardableResult
	func verifyRowShown(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
		XCTAssertTrue(
			row.waitForExistence(timeout: 30),
			"\(name) should be listed")
		return self
	}

	@discardableResult
	func verifyRowHidden(_ name: String) -> Self {
		let row = app.element(matching: TestIdentifiers.BuildingHours.rowPrefix + name)
		XCTAssertTrue(
			row.waitForNonExistence(timeout: 30),
			"\(name) should have been filtered out")
		return self
	}
}
