import XCTest

struct ImportantContactsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.importantContacts)
	}

	@discardableResult
	func verifyImportantContactsTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.importantContacts)
	}
}
