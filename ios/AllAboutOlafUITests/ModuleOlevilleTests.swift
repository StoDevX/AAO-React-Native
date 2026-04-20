import XCTest

final class ModuleOlevilleTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		OlevilleScreen(app: app)
			.navigate()
			.dismissSafariAndReturn()
	}
}
