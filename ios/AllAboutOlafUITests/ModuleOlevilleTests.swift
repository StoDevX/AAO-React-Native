import XCTest

class ModuleOlevilleTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		OlevilleScreen(app: app)
			.navigate()
			.dismissSafari()
			.checkReturnedToHomescreen()
	}
}
