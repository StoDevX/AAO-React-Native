import XCTest

class ModuleHomeTests: UITestCase {
	func testShowsTheHomeScreen() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.checkMenusButtonExists()
	}

	func testLongPressNoticeTogglesDevMode() throws {
		HomeScreen(app: app)
			.checkHomescreenExists()
			.longPressNotice()
			.tapEnableDevMode()
			.openSettings()
			.checkDeveloperSectionVisible()
	}
}
