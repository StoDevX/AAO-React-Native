import XCTest

struct SettingsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func selectAppIcon(iconName: String, springboard: XCUIApplication) -> Self {
		let row = app.buttons[iconName]
		XCTAssertTrue(
			row.waitForExistence(timeout: 10),
			"\(iconName) row should be on screen before tapping it")
		// A coordinate tap goes to a screen point and asks no questions, so it
		// would happily land on whatever covers a row that is present in the
		// tree but not actually reachable. Tapping the element checks this for
		// us; tapping a point does not.
		XCTAssertTrue(row.isHittable, "\(iconName) row should be hittable")

		// Tap the row's screen point through SpringBoard rather than tapping the
		// row itself. A tap on our own app does not return until that app
		// signals it has gone quiet, and the icon-change alert this tap raises
		// stops it doing so -- so the tap costs a full 60s quiescence timeout
		// after having already landed. SpringBoard is quiet, and the point is
		// the same point, so going through it skips the wait entirely.
		//
		// Read the frame first, while the app is still quiet and the query is
		// cheap.
		let target = row.frame
		springboard.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: target.midX, dy: target.midY))
			.tap()

		// dismiss the os-level dialog
		let iconChangeOK = springboard.buttons["OK"]
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear")
		iconChangeOK.tap()

		// Wait rather than read once: the screen learns the new icon back from
		// the system asynchronously, so the trait lands a moment after the alert
		// is gone.
		let selected = app.buttons
			.matching(NSPredicate(format: "label == %@ AND isSelected == true", iconName))
			.firstMatch
		XCTAssertTrue(
			selected.waitForExistence(timeout: 10),
			"\(iconName) should be selected after tapping it")

		return self
	}

}
