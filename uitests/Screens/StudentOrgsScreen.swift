import XCTest

struct StudentOrgsScreen: Screen {
	let app: XCUIApplication

	/// SwiftUI's native A-Z jumplist rail, iOS 26+ (`sectionIndexLabel()`,
	/// added via `patches/@expo__ui@57.0.14.patch`). Carries no per-letter
	/// accessibility elements -- see the same note on `CampusDictionaryScreen`.
	private var sectionIndexRail: XCUIElement {
		app.otherElements["Section index"]
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.studentOrgs)
	}

	@discardableResult
	func verifyStudentOrgsTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.studentOrgs)
	}

	/// Taps near the bottom of the section index rail and asserts the list
	/// actually scrolled. See `CampusDictionaryScreen.verifySectionIndexRailScrolls`
	/// for why this cannot assert which section it landed on.
	@discardableResult
	func verifySectionIndexRailScrolls() throws -> Self {
		guard #available(iOS 26.0, *) else {
			throw XCTSkip("sectionIndexLabel() needs iOS 26; the rail does not exist below it")
		}

		let list = app.collectionViews[TestIdentifiers.StudentOrgs.list]
		XCTAssertTrue(list.waitForExistence(timeout: 10), "the student orgs list never appeared")
		XCTAssertTrue(
			sectionIndexRail.waitForExistence(timeout: 10),
			"no section index rail appeared -- sectionIndexLabel needs iOS 26")
		capture("Student Orgs with a section index rail")

		let firstRowBefore = list.buttons.firstMatch.label

		sectionIndexRail.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.95)).tap()

		let firstRowAfter = list.buttons.firstMatch.label
		XCTAssertNotEqual(
			firstRowAfter, firstRowBefore,
			"tapping near the bottom of the section index rail should scroll the list")
		return self
	}
}
