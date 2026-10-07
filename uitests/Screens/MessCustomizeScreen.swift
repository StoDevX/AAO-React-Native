import XCTest

/// The Messenger's paintbrush sheet: paper stains, front page photos, and dark Photo stories.
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
			issueStains.existsOrAppears(within: 10), "Customize should offer Paper Stains")
		return self
	}

	/// Choose a stain kind from the picker's menu and wait for the picker to show it.
	@discardableResult
	func chooseStain(_ name: String) -> Self {
		choose(name, from: issueStains)
	}

	/// Turn Dark page for Photo stories on or off, tapping the switch itself: a tap at the
	/// row's centre lands on the label, which flips nothing in a Form.
	@discardableResult
	func keepPhotoStoriesDark(_ on: Bool) -> Self {
		let toggle = sheet.switches[TestIdentifiers.MessCustomize.keepPhotoStoriesDark]
		XCTAssertTrue(toggle.existsOrAppears(within: 10), "Customize should offer Dark page for Photo stories")
		let wanted = on ? "1" : "0"
		if toggle.value as? String != wanted {
			toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap()
		}
		let set = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", wanted), object: toggle)
		XCTAssertEqual(XCTWaiter().wait(for: [set], timeout: 5), .completed, "the switch should read \(wanted)")
		return self
	}

	/// Close the sheet with its close button.
	@discardableResult
	func close() -> Self {
		let button = app.buttons[TestIdentifiers.Customize.close].firstMatch
		XCTAssertTrue(button.existsOrAppears(within: 10), "Customize should have a close button")
		button.tap()
		XCTAssertTrue(sheet.waitForNonExistence(timeout: 10), "Customize should close")
		return self
	}
}
