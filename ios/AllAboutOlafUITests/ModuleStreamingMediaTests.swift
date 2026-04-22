import XCTest

class ModuleStreamingMediaTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.checkTabs()
	}
}
