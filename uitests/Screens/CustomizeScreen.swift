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
		let id = TestIdentifiers.StreamingMedia.showRadioPlayer
		let toggle = sheet.switches[id]
		XCTAssertTrue(toggle.waitUntilExists(timeout: 10), "Customize should offer Radio Player")
		let before = toggle.value as? String ?? ""
		// Waiting for the switch to report the other value means a tap that
		// flipped nothing fails here rather than as a missing bar on Home.
		let changed = sheet.switches
			.matching(NSPredicate(format: "identifier == %@ AND value != %@", id, before)).firstMatch
		// The element spans the whole row, and a tap at its centre lands on the
		// label, which flips nothing in a Form -- as for a person. Tap the
		// switch at the trailing end instead.
		return tap(toggle, until: changed, named: "Radio Player", wait: 5, at: CGVector(dx: 0.92, dy: 0.5))
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
