import XCTest

struct NewsScreen: Screen {
	let app: XCUIApplication
	/// The home tile that opens this feed
	let tile: String
	/// The feed's navigation bar title
	let title: String

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[title]
	}
}
