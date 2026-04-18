import XCTest

class ModuleHomeTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

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

		// The menu presents two items: "Restart app" and "Enable dev mode".
		// Tap the latter to flip the persisted dev-mode override on.
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
}
