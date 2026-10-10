import XCTest

/// Wiki Monkeys opens on its own Home, served from its fixtures.
/// Tags: campus:example.college
final class ExampleCollegeTests: UITestCase {
	override class var campus: Campus? { .example }

	/// Some element on screen whose label holds `text`, as a tile's label does.
	private func shows(_ text: String) -> XCUIElement {
		app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
	}

	func testHomeIsWikiMonkeys() throws {
		XCTAssert(shows("The Valley Echo").waitUntilExists(timeout: 10), "Home should offer The Valley Echo")
		XCTAssert(shows("Valley Map").exists, "Home should offer Valley Map")
	}
}
