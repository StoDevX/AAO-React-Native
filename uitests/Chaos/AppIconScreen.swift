import XCTest

/// Customize → App Icon: the gallery of icons the app can wear.
struct AppIconScreen: Screen {
	let app: XCUIApplication

	var gallery: XCUIElement { app.element(matching: TestIdentifiers.Customize.appIconScreen) }

	/// Open the gallery the way a user does, from the Customize sheet.
	@discardableResult
	func navigate() -> Self {
		HomeScreen(app: app).checkHomescreenExists().openCustomize()
		return tap(
			app.buttons[TestIdentifiers.Customize.appIconRow].firstMatch, until: gallery,
			named: "Customize's App Icon row")
	}

	/// An icon's tile, found by its title.
	func icon(named iconName: String) -> XCUIElement {
		gallery.buttons[iconName].firstMatch
	}

	/// The gallery is longer than the sheet and builds lazily, so a tile chosen
	/// earlier can be off screen, and out of the tree, by the time the next one
	/// is wanted. Scrolls until the whole tile is on screen.
	///
	/// Drags are slow, held and 150pt long: a quick swipe flings the list past
	/// the tile, and a swipe down with the list already at its top drags the
	/// sheet closed instead. A tile in the tree says which way to go; one that
	/// is not is looked for further down first, turning back once a drag shows
	/// nothing new.
	func scrollIntoView(_ tile: XCUIElement) {
		let screen = app.windows.firstMatch.frame
		let bottom = screen.maxY - 40
		// Hittable is not enough: XCUITest calls a tile hittable while part of it
		// is under the sheet's navigation bar or the screen's bottom edge, where a
		// tap at its middle misses.
		let isReachable = {
			tile.exists && tile.isHittable && tile.frame.minY >= barBottom()
				&& tile.frame.maxY <= bottom
		}
		var lookingDown = true
		for _ in 0..<32 {
			if isReachable() {
				break
			}
			if tile.exists {
				lookingDown = tile.frame.minY >= barBottom()
			}
			let shown = visibleTiles()
			drag(down: lookingDown, between: barBottom(), and: bottom)
			if !tile.exists && visibleTiles() == shown {
				lookingDown.toggle()
			}
		}
	}

	/// The tiles in the tree and where they sit, to tell whether a drag moved
	/// anything: a drag that grows the sheet moves the tiles without changing
	/// which ones are there.
	private func visibleTiles() -> [String] {
		gallery.buttons.allElementsBoundByIndex.map { "\($0.label)@\(Int($0.frame.minY))" }
	}

	/// One slow, held 150pt drag that shows more of the gallery below (`down`)
	/// or above, starting inside the list so it never grabs the bar.
	private func drag(down: Bool, between top: CGFloat, and bottom: CGFloat) {
		let midX = app.windows.firstMatch.frame.midX
		let from = down ? bottom - 60 : top + 60
		let to = down ? from - 150 : from + 150
		let origin = app.coordinate(withNormalizedOffset: .zero)
		origin.withOffset(CGVector(dx: midX, dy: from))
			.press(
				forDuration: 0.1,
				thenDragTo: origin.withOffset(CGVector(dx: midX, dy: to)),
				withVelocity: .slow,
				thenHoldForDuration: 0.3)
	}

	/// Where the sheet's navigation bar ends. The bar is not always in the
	/// accessibility tree, so this takes the lowest bar there is, and never less
	/// than where a full-height sheet's bar ends on a 390x844 iPhone.
	private func barBottom() -> CGFloat {
		let fullHeightSheetBar: CGFloat = 150
		let bars = app.navigationBars.allElementsBoundByIndex.map(\.frame.maxY)
		return max(bars.max() ?? 0, fullHeightSheetBar)
	}
}
