import XCTest

final class ModuleCourseCatalogTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CourseCatalogScreen(app: app)
			.navigate()
			.verifyCourseCatalogTitle()
			.checkRecentSectionExists()
	}
}
