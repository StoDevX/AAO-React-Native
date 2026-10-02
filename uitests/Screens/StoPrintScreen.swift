import XCTest

struct StoPrintScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Print Jobs"]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/print-jobs", mountedWhen: mounted)
	}
}
