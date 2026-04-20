import XCTest

struct MoreScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.more)
	}

	@discardableResult
	func verifyMoreTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.more)
	}
}
