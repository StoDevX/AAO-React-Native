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

	/// An icon's tile, found by its title.
	func icon(named iconName: String) -> XCUIElement {
		gallery.buttons[iconName].firstMatch
	}

	/// The gallery is longer than the sheet and builds lazily, so a tile chosen
	/// earlier can be off screen by the time the next one is wanted. Looks down
	/// the gallery, then back up it.
	func scrollIntoView(_ tile: XCUIElement) {
		// Hittable is not enough: XCUITest calls a tile hittable while part of it
		// is under the sheet's navigation bar or the screen's bottom edge, where a
		// tap at its middle misses. Wait for the whole tile, between the bar and
		// the home indicator.
		let screen = app.windows.firstMatch.frame
		let isReachable = {
			return tile.exists && tile.isHittable && tile.frame.minY >= barBottom()
				&& tile.frame.maxY <= screen.maxY - 40
		}
		for _ in 0..<8 where !isReachable() { gallery.swipeUp() }
		for _ in 0..<16 where !isReachable() { gallery.swipeDown() }
	}

	/// Where the sheet's navigation bar ends. The bar is not always in the
	/// accessibility tree, so this takes the lowest bar there is, and never less
	/// than where a full-height sheet's bar ends on a 390x844 iPhone.
	private func barBottom() -> CGFloat {
		let fullHeightSheetBar: CGFloat = 150
		let bars = app.navigationBars.allElementsBoundByIndex.map(\.frame.maxY)
		return max(bars.max() ?? 0, fullHeightSheetBar)
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
		XCTAssertTrue(tile.isHittable, "\(iconName) should be hittable")

		// Tap the tile's screen point through SpringBoard rather than tapping the
		// tile itself. A tap on our own app does not return until that app
		// signals it has gone quiet, and the icon-change alert this tap raises
		// stops it doing so -- so the tap costs a full 60s quiescence timeout
		// after having already landed. SpringBoard is quiet, and the point is
		// the same point, so going through it skips the wait entirely.
		//
		// Read the frame first, while the app is still quiet and the query is
		// cheap.
		let target = tile.frame
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
		let selected = gallery.buttons
			.matching(NSPredicate(format: "label == %@ AND isSelected == true", iconName))
			.firstMatch
		XCTAssertTrue(
			selected.waitForExistence(timeout: 10),
			"\(iconName) should be selected after tapping it")

		return self
	}
}
