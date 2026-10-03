import XCTest

/// The Messenger's paintbrush sheet: the Issue Stains choice.
struct MessCustomizeScreen: Screen {
	let app: XCUIApplication

	var sheet: XCUIElement { app.element(matching: TestIdentifiers.MessCustomize.screen) }

	/// The menu picker, whose value is the stain kind chosen.
	private var issueStains: XCUIElement {
		sheet.buttons[TestIdentifiers.MessCustomize.issueStains].firstMatch
	}

	@discardableResult
	func checkOpen() -> Self {
		XCTAssertTrue(sheet.waitForExistence(timeout: 10), "the Messenger's Customize should open")
		XCTAssertTrue(
			issueStains.waitForExistence(timeout: 10), "Customize should offer Issue Stains")
		return self
	}

	/// Choose a stain kind from the picker's menu and wait for the picker to show it.
	@discardableResult
	func chooseStain(_ name: String) -> Self {
		issueStains.tap()
		let item = app.buttons[name].firstMatch
		XCTAssertTrue(item.waitForExistence(timeout: 10), "the stain menu should offer \(name)")
		capture("Issue Stains menu open")
		item.tap()
		let chosen = XCTNSPredicateExpectation(
			predicate: NSPredicate(format: "value == %@ OR label CONTAINS %@", name, name),
			object: issueStains)
		XCTAssertEqual(
			XCTWaiter().wait(for: [chosen], timeout: 10), .completed,
			"Issue Stains should show \(name) (it reads \(issueStains.label), \(String(describing: issueStains.value)))")
		return self
	}

	/// Close the sheet with its close button.
	@discardableResult
	func close() -> Self {
		let button = app.buttons[TestIdentifiers.Customize.close].firstMatch
		XCTAssertTrue(button.waitForExistence(timeout: 10), "Customize should have a close button")
		button.tap()
		XCTAssertTrue(sheet.waitForNonExistence(timeout: 10), "Customize should close")
		return self
	}
}
