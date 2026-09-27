import XCTest

struct HomeScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func checkHomescreenExists() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")
		return self
	}

	/// Taps a home tile near its top-right corner rather than its centre.
	///
	/// A SwiftUI button's hit region comes from its label, so a tile whose fill
	/// and frame are applied without `contentShape` reports the full colored
	/// rect to the accessibility tree while only the icon and title actually
	/// respond. `tap()` uses the reported centre, which lands on the live part
	/// and passes either way -- so only an off-centre tap can tell them apart.
	@discardableResult
	func tapTileNearItsEdge(_ label: String) -> Self {
		let tile = app.buttons[label].firstMatch
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"\(label) tile should be visible")
		// Top-right: the icon is centred and narrow, so this corner is empty
		// fill on the card. The bottom of the tile is its label, which a long
		// name runs most of the width of.
		tile.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.15)).tap()
		return self
	}

	@discardableResult
	func checkHomescreenDismissed() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForNonExistence(timeout: 30),
			"Tapping a tile away from its centre should still navigate")
		return self
	}

	@discardableResult
	func longPressNotice() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		XCTAssertTrue(
			notice.waitForExistence(timeout: 30),
			"Home notice widget should be visible")
		// The notice sits under every group, below the fold.
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		for _ in 0..<10 where !notice.isHittable {
			homescreen.swipeUp()
		}
		notice.press(forDuration: 1.0)
		return self
	}

	@discardableResult
	func tapEnableDevMode() -> Self {
		let enableDevMode = app.buttons[TestIdentifiers.Settings.enableDevMode]
		XCTAssertTrue(
			enableDevMode.waitForExistence(timeout: 10),
			"Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()
		return self
	}

	@discardableResult
	func openSettings() -> Self {
		let settingsButton = app.buttons[TestIdentifiers.Navigation.openSettings]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 10),
			"Settings button should appear on home screen")
		settingsButton.tap()
		return self
	}

	@discardableResult
	func checkDeveloperSectionVisible() -> Self {
		let developerSection = app.staticTexts[TestIdentifiers.Settings.developer]
		// DEVELOPER is the last section in the Settings form, so it starts out
		// unbuilt rather than merely offscreen.
		scrollUntilExists(developerSection)
		XCTAssertTrue(
			developerSection.waitForExistence(timeout: 30),
			"DEVELOPER section should be visible after enabling dev mode")
		return self
	}

	/// Four tiles to a row: the first group's four share a top edge, each to
	/// the right of the one before.
	@discardableResult
	func checkTilesSitFourAbreast() -> Self {
		let tiles = firstTiles(4)
		for i in 1..<4 {
			XCTAssertEqual(tiles[i].minY, tiles[0].minY, accuracy: 1, "Tile \(i + 1) should share the first row")
			XCTAssertGreaterThan(tiles[i].minX, tiles[i - 1].maxX, "Tile \(i + 1) should sit right of tile \(i)")
		}
		return self
	}

	/// Two tiles to a row: the first two share a top edge, and the third starts
	/// the next row under the first. Four to a row would pass the first half
	/// alone, which is why the third tile is checked.
	@discardableResult
	func checkTilesSitTwoAbreast() -> Self {
		let tiles = firstTiles(3)
		XCTAssertEqual(tiles[0].minY, tiles[1].minY, accuracy: 1, "The first two tiles should share a row")
		XCTAssertGreaterThan(tiles[1].minX, tiles[0].maxX, "The second tile should sit right of the first")
		XCTAssertEqual(tiles[2].minX, tiles[0].minX, accuracy: 1, "The third tile should start a new row")
		XCTAssertGreaterThan(tiles[2].minY, tiles[0].maxY, "The third tile should sit below the first")
		return self
	}

	/// No tile's icon reaches out past the top of its card. The glyph has no
	/// element of its own -- a button's children merge into its one element --
	/// but the button's frame spans everything it draws, so an icon spilling
	/// over the card's top edge lifts the frame's top edge above the card. This
	/// reads the screenshot at the frame's top edge, midway across, where the
	/// icon never sits: it should find the card there, not the page.
	@discardableResult
	func checkTileIconsStayInsideTheirCards() -> Self {
		let grid = app.element(matching: TestIdentifiers.Home.groupGrid(TestIdentifiers.Home.eatGroup))
		XCTAssertTrue(grid.waitForExistence(timeout: 30), "Home should show its first group's tiles")
		let tiles = grid.buttons.allElementsBoundByIndex.filter { app.frame.contains($0.frame) }
		XCTAssertFalse(tiles.isEmpty, "At least one tile should be wholly on screen")

		guard let pixels = ScreenPixels(app.screenshot().image) else {
			XCTFail("The screenshot should be readable as pixels")
			return self
		}
		// The screen margin left of the grid is the page's background, whichever
		// column a tile sits in.
		let marginX = grid.frame.minX / 2
		for tile in tiles {
			let top = tile.frame.minY + 2
			let page = pixels.colour(at: CGPoint(x: marginX, y: top))
			XCTAssertFalse(
				pixels.colour(at: CGPoint(x: tile.frame.midX, y: top)).isClose(to: page),
				"\(tile.label)'s card should start at the top of the tile, not below an icon spilling over it")
		}
		return self
	}

	private func firstTiles(_ count: Int) -> [CGRect] {
		let grid = app.element(matching: TestIdentifiers.Home.groupGrid(TestIdentifiers.Home.eatGroup))
		XCTAssertTrue(grid.waitForExistence(timeout: 30), "Home should show its first group's tiles")
		let tiles = grid.buttons
		XCTAssertGreaterThanOrEqual(tiles.count, count, "Home should have at least \(count) tiles")
		return (0..<count).map { tiles.element(boundBy: $0).frame }
	}
}
