import XCTest

struct AthleticsScreen: Screen {
	let app: XCUIApplication

	/// Athletics is a `devOnly` tile, so it is absent from a build that embedded
	/// its bundle -- which is how CI runs, and why enabling dev mode cannot be
	/// left to whoever ran the build. Reaching for the switch only when the tile
	/// is missing keeps this working either way, rather than assuming a state
	/// the previous test may already have left behind.
	@discardableResult
	func navigate() -> Self {
		let tile = app.buttons[TestIdentifiers.Buttons.athletics].firstMatch
		if !tile.waitForExistence(timeout: 10) {
			HomeScreen(app: app)
				.longPressNotice()
				.tapEnableDevMode()

			XCTAssertTrue(
				tile.waitForExistence(timeout: 30),
				"Athletics tile should appear once dev mode is on")
		}

		return navigateFromHome(to: TestIdentifiers.Buttons.athletics)
	}
}
