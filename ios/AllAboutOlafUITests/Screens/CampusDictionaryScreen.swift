import XCTest

struct CampusDictionaryScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.campusDictionary)
	}

	@discardableResult
	func verifyCampusDictionaryTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.campusDictionary)
	}
}
