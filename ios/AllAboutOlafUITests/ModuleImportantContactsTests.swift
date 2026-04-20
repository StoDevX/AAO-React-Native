import XCTest

final class ModuleImportantContactsTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		ImportantContactsScreen(app: app)
			.navigate()
			.verifyImportantContactsTitle()
	}
}
