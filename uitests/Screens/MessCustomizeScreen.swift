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
			issueStains.waitForExistence(timeout: 10), "Customize should offer Paper Stains")
		return self
	}

	/// The menu picker for the photo tone.
	private var photoTone: XCUIElement {
		sheet.buttons[TestIdentifiers.MessCustomize.photoTone].firstMatch
	}

	/// Choose a stain kind from the picker's menu and wait for the picker to show it.
	@discardableResult
	func chooseStain(_ name: String) -> Self {
		choose(name, from: issueStains)
	}

	/// Choose a photo tone from the picker's menu and wait for the picker to show it.
	@discardableResult
	func choosePhotoTone(_ name: String) -> Self {
		choose(name, from: photoTone)
	}

	private func choose(_ name: String, from picker: XCUIElement) -> Self {
		XCTAssertTrue(picker.waitForExistence(timeout: 10), "Customize should offer the picker for \(name)")
		picker.tap()
		let item = app.buttons[name].firstMatch
		XCTAssertTrue(item.waitForExistence(timeout: 10), "the menu should offer \(name)")
		item.tap()
		let chosen = XCTNSPredicateExpectation(
			predicate: NSPredicate(format: "value == %@ OR label CONTAINS %@", name, name),
			object: picker)
		XCTAssertEqual(
			XCTWaiter().wait(for: [chosen], timeout: 10), .completed,
			"the picker should show \(name) (it reads \(picker.label), \(String(describing: picker.value)))")
		return self
	}

	/// Turn Dark page for Photo stories on or off, tapping the switch itself: a tap at the
	/// row's centre lands on the label, which flips nothing in a Form.
	@discardableResult
	func keepPhotoStoriesDark(_ on: Bool) -> Self {
		let toggle = sheet.switches[TestIdentifiers.MessCustomize.keepPhotoStoriesDark]
		XCTAssertTrue(toggle.waitForExistence(timeout: 10), "Customize should offer Dark page for Photo stories")
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
		XCTAssertTrue(button.waitForExistence(timeout: 10), "Customize should have a close button")
		button.tap()
		XCTAssertTrue(sheet.waitForNonExistence(timeout: 10), "Customize should close")
		return self
	}
}
