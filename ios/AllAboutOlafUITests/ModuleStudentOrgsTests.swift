import XCTest

class ModuleStudentOrgsTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.verifyStudentOrgsTitle()
	}
}
