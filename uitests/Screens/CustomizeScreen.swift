import XCTest

/// Home's paintbrush sheet: App Icon, Open Links, Layout, Radio Player, Quick Actions.
struct CustomizeScreen: Screen {
	let app: XCUIApplication

	var sheet: XCUIElement { app.element(matching: TestIdentifiers.Customize.screen) }

	/// Choose how Home lays out its tiles, by the name the Layout menu gives it.
	@discardableResult
	func chooseHomeLayout(_ name: String) -> Self {
		choose(name, from: sheet.buttons[TestIdentifiers.Customize.homeLayout].firstMatch)
	}

	@discardableResult
	func toggleRadioPlayer() -> Self {
		let toggle = sheet.switches[TestIdentifiers.StreamingMedia.showRadioPlayer]
		XCTAssertTrue(toggle.waitUntilExists(timeout: 10), "Customize should offer Radio Player")
		let before = toggle.value as? String
		// The element spans the whole row, and a tap at its centre lands on the
		// label, which flips nothing in a Form -- as for a person. Tap the
		// switch at the trailing end instead.
		toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap()
		// Wait for the switch to report the other value, so a tap that landed
		// on the label and flipped nothing fails here rather than as a missing
		// bar on Home.
		XCTAssertTrue(
			toggle.waitUntilSnapshot("to change from \(before ?? "nil")", timeout: 5) {
				$0.value as? String != (before ?? "")
			},
			"Radio Player should change from \(before ?? "nil")")
		return self
	}

	@discardableResult
	func openQuickActions() -> Self {
		tap(
			sheet.buttons[TestIdentifiers.Customize.quickActionsRow].firstMatch,
			until: app.element(matching: TestIdentifiers.QuickActions.screen),
			named: "Customize's Quick Actions row")
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
