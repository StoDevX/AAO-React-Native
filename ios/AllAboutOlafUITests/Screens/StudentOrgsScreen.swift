import XCTest

struct StudentOrgsScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.studentOrgs)
	}

	@discardableResult
	func verifyStudentOrgsTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.studentOrgs)
	}
}
