import XCTest

struct MoreScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		open(route: "/More", mountedWhen: app.staticTexts[TestIdentifiers.Buttons.more].firstMatch)
	}

	@discardableResult
	func verifyMoreTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.more)
	}
}
