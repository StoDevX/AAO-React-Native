import XCTest

/// Wiki Monkeys opens on its own Home, served from its fixtures.
/// Tags: campus:example.college
final class ExampleCollegeTests: UITestCase {
	func testHomeIsWikiMonkeys() throws {
		XCTAssert(shows("The Valley Echo").waitUntilExists(timeout: 10), "Home should offer The Valley Echo")
		XCTAssert(shows("Valley Map").exists, "Home should offer Valley Map")
	}
}
