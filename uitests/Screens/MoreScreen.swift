import XCTest

struct MoreScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[TestIdentifiers.Buttons.more]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/More", mountedWhen: mounted)
	}

	@discardableResult
	func verifyMoreTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.more)
	}
}
