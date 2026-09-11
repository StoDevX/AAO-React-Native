import XCTest

class ModuleStudentOrgsTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.verifyStudentOrgsTitle()
	}

	func testStudentOrgDetail() throws {
		let screen = StudentOrgsScreen(app: app).navigate()

		// The first org alphabetically, whatever the college is listing today.
		let firstOrg = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "Academic"))
			.firstMatch
		XCTAssertTrue(firstOrg.waitForExistence(timeout: 30), "An org should be listed")
		firstOrg.tap()

		// Wait for a section of the pushed screen, not just the tap: a capture
		// taken straight after lands mid-animation, with both screens on it.
		let category = app.staticTexts["CATEGORY"].firstMatch
		XCTAssertTrue(category.waitForExistence(timeout: 30), "The org detail should be shown")

		screen.capture("Student Orgs - detail")
	}
}
