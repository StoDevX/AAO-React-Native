import XCTest

/// Customize → App Icon: the gallery of icons the app can wear.
struct AppIconScreen: Screen {
	let app: XCUIApplication

	var gallery: XCUIElement { app.element(matching: TestIdentifiers.Customize.appIconScreen) }

	/// Open the gallery the way a user does, from the Customize sheet.
	@discardableResult
	func navigate() -> Self {
		HomeScreen(app: app).checkHomescreenExists().openCustomize()
		let row = app.buttons[TestIdentifiers.Customize.appIconRow].firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 10), "Customize should offer App Icon")
		row.tap()
		XCTAssertTrue(gallery.waitForExistence(timeout: 10), "the icon gallery should open")
		return self
	}

	/// The carousel's scroll view. The screen's identifier passes down to every
	/// element inside it, so the carousel is found by what it holds.
	var carousel: XCUIElement {
		app.scrollViews
			.containing(NSPredicate(format: "label == %@", TestIdentifiers.Customize.primaryIcon))
			.firstMatch
	}

	/// An icon's preview in the carousel, found by its title.
	func icon(named iconName: String) -> XCUIElement {
		carousel.buttons[iconName].firstMatch
	}

	/// The button under the carousel, which reads Use This Icon or, for the
	/// icon already applied, Current Icon.
	var useButton: XCUIElement {
		app.buttons
			.matching(NSPredicate(format: "label IN %@", TestIdentifiers.Customize.useIconLabels))
			.firstMatch
	}

	/// Whether `tile` sits in the middle of the carousel.
	private func isCentred(_ tile: XCUIElement) -> Bool {
		tile.exists && abs(tile.frame.midX - app.windows.firstMatch.frame.midX) < 20
	}

	/// Swipe the carousel until `tile` is in the middle: left first, since the
	/// gallery opens on the current icon and most are after it, then back.
	func scrollIntoView(_ tile: XCUIElement) {
		let row = carousel
		for _ in 0..<14 where !isCentred(tile) { row.swipeLeft(velocity: .slow) }
		for _ in 0..<28 where !isCentred(tile) { row.swipeRight(velocity: .slow) }
	}

	@discardableResult
	func select(_ iconName: String, springboard: XCUIApplication) -> Self {
		let tile = icon(named: iconName)
		scrollIntoView(tile)
		XCTAssertTrue(
			tile.waitForExistence(timeout: 10),
			"\(iconName) should be in the gallery before tapping it")
		// A coordinate tap goes to a screen point and asks no questions, so it
		// would happily land on whatever covers a tile that is present in the
		// tree but not actually reachable. Checking hittability first stops that.
		XCTAssertTrue(isCentred(tile), "\(iconName) should be in the middle of the carousel")
		XCTAssertTrue(useButton.isHittable, "Use This Icon should be hittable")

		// Tap Use This Icon's screen point through SpringBoard rather than
		// tapping the button itself. A tap on our own app does not return until that app
		// signals it has gone quiet, and the icon-change alert this tap raises
		// stops it doing so -- so the tap costs a full 60s quiescence timeout
		// after having already landed. SpringBoard is quiet, and the point is
		// the same point, so going through it skips the wait entirely.
		//
		// Read the frame first, while the app is still quiet and the query is
		// cheap.
		let target = useButton.frame
		springboard.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: target.midX, dy: target.midY))
			.tap()

		let iconChangeOK = springboard.buttons["OK"]
		XCTAssertTrue(
			iconChangeOK.waitForExistence(timeout: 10),
			"Icon change alert should appear")
		iconChangeOK.tap()

		// Wait rather than read once: the gallery learns the new icon back from
		// the system asynchronously, so the trait lands a moment after the alert
		// is gone.
		let selected = carousel.buttons
			.matching(NSPredicate(format: "label == %@ AND isSelected == true", iconName))
			.firstMatch
		XCTAssertTrue(
			selected.waitForExistence(timeout: 10),
			"\(iconName) should be selected after tapping it")

		return self
	}
}
