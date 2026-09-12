import XCTest

class ModuleAthleticsTests: UITestCase {
	func testAthleticsFilterList() throws {
		let screen = AthleticsScreen(app: app).navigate()

		// The tab bar is a TouchableOpacity carrying accessibilityRole="tab",
		// which does not surface as a button -- so this asks for any descendant
		// with the label rather than a button with it.
		let filterTab = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@", "Filter"))
			.firstMatch
		let found = filterTab.waitForExistence(timeout: 30)

		// Captured before the assertion: Athletics draws no tab bar at all when
		// the feed has no scores, and the screenshot is what tells the two
		// apart.
		screen.capture("Athletics - after navigate")
		XCTAssertTrue(found, "Filter tab should be visible on Athletics")

		filterTab.tap()

		let sports = app.staticTexts["Women's Sports"].firstMatch
		XCTAssertTrue(sports.waitForExistence(timeout: 30), "The Filter tab should be showing")

		screen.capture("Athletics - Filter")
	}
}
