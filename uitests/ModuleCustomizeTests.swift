import XCTest

class ModuleCustomizeTests: UITestCase {
	func testPaintbrushOpensCustomize() throws {
		let customize = HomeScreen(app: app).checkHomescreenExists().openCustomize()
		XCTAssertTrue(
			customize.sheet.buttons[TestIdentifiers.Customize.openLinksIn].waitForExistence(timeout: 10),
			"Customize should offer Open Links In")
		customize.capture("customize-sheet").close()
	}
}
