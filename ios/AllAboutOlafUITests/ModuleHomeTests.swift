import XCTest

class ModuleHomeTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	// MARK: - Helpers

	/// Long-press the home tile with the given accessibility label (= the tile's
	/// title, e.g. "Menus" / "SIS"), then tap the menu item with the given size
	/// label (e.g. "Small" / "Large" / "Wide"). Querying by accessibility label
	/// works around an iOS quirk where testID set on react-native-ios-context-menu's
	/// ContextMenuButton wrapper is collapsed/dropped from the accessibility tree
	/// when the wrapped child is itself an accessible element.
	private func resizeTile(_ tileLabel: String, to sizeLabel: String) {
		let tile = app.buttons[tileLabel]
		XCTAssertTrue(
			tile.waitForExistence(timeout: 30),
			"tile '\(tileLabel)' should exist")
		tile.press(forDuration: 1.0)

		let menuItem = app.buttons[sizeLabel]
		XCTAssertTrue(
			menuItem.waitForExistence(timeout: 10),
			"Menu item '\(sizeLabel)' should appear on long-press of '\(tileLabel)'")
		menuItem.tap()
	}

	/// Long-press the unofficial-app notice and tap "Reset home screen layout".
	private func resetLayoutFromNoticeMenu() {
		let notice = app.element(matching: "home-notice")
		XCTAssertTrue(notice.waitForExistence(timeout: 10), "Home notice should exist")
		notice.press(forDuration: 1.0)

		let resetItem = app.buttons["Reset home screen layout"]
		XCTAssertTrue(
			resetItem.waitForExistence(timeout: 10),
			"Notice menu should expose 'Reset home screen layout'")
		resetItem.tap()
	}

	// MARK: - Existing tests

	func testShowsTheHomeScreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")

		let menus = app.buttons["Menus"]
		XCTAssertTrue(
			menus.waitForExistence(timeout: 30),
			"Home screen should show Menus button")
	}

	func testLongPressNoticeTogglesDevMode() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Home screen should be visible")

		// Long-press the unofficial-app notice widget to open its UIMenu.
		// This exercises the react-native-ios-context-menu v3 native code
		// path against a Release build.
		let notice = app.element(matching: "home-notice")
		XCTAssertTrue(
			notice.waitForExistence(timeout: 30),
			"Home notice widget should be visible")
		notice.press(forDuration: 1.0)

		// The menu presents three items: "Restart app", "Enable dev mode",
		// and "Reset home screen layout". Tap the second to flip the persisted
		// dev-mode override on.
		let enableDevMode = app.buttons["Enable dev mode"]
		XCTAssertTrue(
			enableDevMode.waitForExistence(timeout: 10),
			"Context menu should show 'Enable dev mode' option")
		enableDevMode.tap()

		// Open Settings and confirm the DEVELOPER section is now rendered,
		// proving the override reached the gated section in a Release build.
		let settingsButton = app.buttons["button-open-settings"]
		XCTAssertTrue(
			settingsButton.waitForExistence(timeout: 10),
			"Settings button should appear on home screen")
		settingsButton.tap()

		let developerSection = app.staticTexts["DEVELOPER"]
		XCTAssertTrue(
			developerSection.waitForExistence(timeout: 30),
			"DEVELOPER section should be visible after enabling dev mode")
	}

	// MARK: - Resizable tiles

	func testLongPressTileChangesSize() throws {
		addTeardownBlock { [weak self] in
			self?.resetLayoutFromNoticeMenu()
		}

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		let menusLabel = "Menus"

		var originalFrame: CGRect = .zero

		XCTContext.runActivity(named: "resize tile via context menu") { _ in
			let tile = app.buttons[menusLabel]
			XCTAssertTrue(tile.waitForExistence(timeout: 10))
			originalFrame = tile.frame

			resizeTile(menusLabel, to: "Large")

			let resized = app.buttons[menusLabel]
			XCTAssertTrue(resized.waitForExistence(timeout: 10))
			XCTAssertGreaterThan(
				resized.frame.height,
				originalFrame.height * 1.5,
				"Resizing to Large should at least 1.5× the tile's height")
		}

		XCTContext.runActivity(named: "size persists across launches") { _ in
			app.terminate()
			app.launch()

			let tile = app.buttons[menusLabel]
			XCTAssertTrue(tile.waitForExistence(timeout: 30))
			tile.press(forDuration: 1.0)

			let largeItem = app.buttons["Large"]
			XCTAssertTrue(largeItem.waitForExistence(timeout: 10))
			XCTAssertTrue(
				largeItem.isSelected,
				"After relaunch, 'Large' should still be the selected size")

			// Dismiss the menu by tapping a neutral area of the home screen.
			app.element(matching: "screen-homescreen").tap()
		}

		XCTContext.runActivity(named: "small tile preserves accessibility label") { _ in
			resizeTile(menusLabel, to: "Small")
			XCTAssertTrue(
				app.buttons[menusLabel].exists,
				"Even at Small (1x1) the 'Menus' accessibility label should remain announceable")
		}

		XCTContext.runActivity(named: "reset from notice menu restores defaults") { _ in
			resetLayoutFromNoticeMenu()

			let tile = app.buttons[menusLabel]
			XCTAssertTrue(tile.waitForExistence(timeout: 10))
			XCTAssertEqual(
				tile.frame.height,
				originalFrame.height,
				accuracy: 1.0,
				"After reset, the tile should return to its default height")
			XCTAssertEqual(
				tile.frame.width,
				originalFrame.width,
				accuracy: 1.0,
				"After reset, the tile should return to its default width")
		}
	}

	func testGapBehaviorWithOrphanSmallTile() throws {
		addTeardownBlock { [weak self] in
			self?.resetLayoutFromNoticeMenu()
		}

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		// Menus → Small (1x1) at col 0; SIS → Wide (2x4) needs 4 cols and so
		// drops to row 1 because only 3 cols remain on row 0.
		resizeTile("Menus", to: "Small")
		resizeTile("SIS", to: "Wide")

		let menus = app.buttons["Menus"]
		let sis = app.buttons["SIS"]
		XCTAssertTrue(menus.waitForExistence(timeout: 10))
		XCTAssertTrue(sis.waitForExistence(timeout: 10))

		XCTAssertGreaterThan(
			sis.frame.minY,
			menus.frame.maxY,
			"SIS (Wide) should drop below Menus (Small) since 1+4 > 4 cols")
	}

	func testRotationReflowsLayout() throws {
		addTeardownBlock {
			XCUIDevice.shared.orientation = .portrait
		}

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		let tile = app.buttons["Menus"]
		XCTAssertTrue(tile.waitForExistence(timeout: 10))
		let portraitWidth = tile.frame.width

		XCUIDevice.shared.orientation = .landscapeLeft

		// Wait for the layout animation to settle.
		let landscapeWidthChanged = NSPredicate(format: "frame.size.width != %f", portraitWidth)
		let expectation = XCTNSPredicateExpectation(predicate: landscapeWidthChanged, object: tile)
		XCTAssertEqual(
			XCTWaiter.wait(for: [expectation], timeout: 10.0),
			.completed,
			"Tile width should change after rotation to landscape")

		XCTAssertNotEqual(
			tile.frame.width,
			portraitWidth,
			"Layout should recompute for the new screen width")
	}
}
