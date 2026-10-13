import XCTest

/// A paper's paintbrush sheet: paper stains, front page photos, and dark Photo stories.
struct MessCustomizeScreen: Screen {
	let app: XCUIApplication

	var sheet: XCUIElement { app.element(matching: TestIdentifiers.MessCustomize.screen) }

	/// The menu picker, whose value is the stain kind chosen.
	private var issueStains: XCUIElement {
		sheet.buttons[TestIdentifiers.MessCustomize.issueStains].firstMatch
	}

	@discardableResult
	func checkOpen() -> Self {
		XCTAssertTrue(sheet.waitUntilExists(timeout: 10), "the paper's Customize should open")
		XCTAssertTrue(
			issueStains.waitUntilExists(timeout: 10), "Customize should offer Paper Stains")
		return self
	}

	/// Turn Dark page for Photo stories on or off, tapping the switch itself: a tap at the
	/// row's centre lands on the label, which flips nothing in a Form.
	@discardableResult
	func keepPhotoStoriesDark(_ on: Bool) -> Self {
		let id = TestIdentifiers.MessCustomize.keepPhotoStoriesDark
		let toggle = sheet.switches[id]
		XCTAssertTrue(toggle.waitUntilExists(timeout: 10), "Customize should offer Dark page for Photo stories")
		let wanted = on ? "1" : "0"
		if toggle.value as? String != wanted {
			let flipped = sheet.switches
				.matching(NSPredicate(format: "identifier == %@ AND value == %@", id, wanted)).firstMatch
			tap(toggle, until: flipped, named: "Dark page for Photo stories", wait: 5, at: CGVector(dx: 0.92, dy: 0.5))
		}
		return self
	}

	/// Close the sheet with its close button.
	@discardableResult
	func close() -> Self {
		let button = app.buttons[TestIdentifiers.Customize.close].firstMatch
		XCTAssertTrue(button.waitUntilExists(timeout: 10), "Customize should have a close button")
		button.tap()
		XCTAssertTrue(sheet.waitUntilGone(timeout: 10), "Customize should close")
		return self
	}
}
