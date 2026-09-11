import XCTest

class ModuleCourseCatalogTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CourseCatalogScreen(app: app)
			.navigate()
			.verifyCourseCatalogTitle()
			.checkRecentSectionExists()
	}

	/// Searches the catalogue, which under UI testing holds one course, and
	/// opens it. That course carries something for every section the detail
	/// screen draws.
	func testCourseDetail() throws {
		let screen = CourseCatalogScreen(app: app).navigate()

		let field = app.searchFields.firstMatch
		XCTAssertTrue(field.waitForExistence(timeout: 30), "Course search should offer a field")
		field.tap()
		field.typeText(TestIdentifiers.CourseCatalog.aCourse)

		// Any descendant, not a button: the results list is the one screen still
		// on SectionList, so its rows are React Native views rather than
		// SwiftUI buttons.
		let result = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label CONTAINS %@", TestIdentifiers.CourseCatalog.aCourse))
			.firstMatch
		XCTAssertTrue(result.waitForExistence(timeout: 30), "The fixture course should be found")
		result.tap()

		let prerequisites = app.staticTexts["Prerequisites"].firstMatch
		XCTAssertTrue(
			prerequisites.waitForExistence(timeout: 30),
			"The course detail screen should be shown")

		screen.capture("Course detail")
	}
}
