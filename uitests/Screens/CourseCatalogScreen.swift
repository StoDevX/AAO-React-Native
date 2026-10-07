import XCTest

struct CourseCatalogScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[TestIdentifiers.CourseCatalog.title]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/course-search", mountedWhen: mounted)
	}

	@discardableResult
	func checkRecentSectionExists() -> Self {
		let recent = app.staticTexts[TestIdentifiers.CourseCatalog.recent].firstMatch
		XCTAssertTrue(
			recent.waitUntilExists(timeout: 30),
			"Recent section should be visible")
		return self
	}

	/// Type `text` into the search field, and read it back: a search that
	/// typed nothing would find nothing and fail for the wrong reason.
	@discardableResult
	func search(for text: String) -> Self {
		let field = app.searchFields.firstMatch
		XCTAssertTrue(field.waitUntilExists(timeout: 30), "Course search should offer a field")
		field.tap()
		field.typeText(text)
		XCTAssertEqual(field.value as? String, text, "Typing should put the query in the search field")
		return self
	}

	/// Open the result naming `course`, and check its detail screen came up.
	///
	/// Any descendant, not a button: the results list is the one screen still
	/// on SectionList, so its rows are React Native views rather than SwiftUI
	/// buttons. The detail's Prerequisites row is drawn for every course.
	@discardableResult
	func openResult(_ course: String) -> Self {
		let result = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label CONTAINS %@", course))
			.firstMatch
		XCTAssertTrue(result.waitUntilExists(timeout: 30), "\(course) should be found")
		return tap(
			result, until: app.staticTexts[TestIdentifiers.CourseCatalog.prerequisites].firstMatch,
			named: "\(course)'s result")
	}
}
