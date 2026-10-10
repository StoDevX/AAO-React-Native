import XCTest

/// Tags: campus:example.college
class ModuleCourseCatalogTests: UITestCaseUnbooted {
	override class var campus: Campus? { .example }

	/// Opens on its Recent section, then searches the catalogue, which under UI
	/// testing holds one Wiki Monkeys course, and opens it. The search runs against the
	/// on-device SQLite catalogue, which Jest's Node-side database cannot stand
	/// in for.
	func testSearchingOpensACourseDetail() throws {
		CourseCatalogScreen(app: app)
			.navigate()
			.checkRecentSectionExists()
			.search(for: TestIdentifiers.CourseCatalog.aCourse)
			.openResult(TestIdentifiers.CourseCatalog.aCourse)
	}
}
