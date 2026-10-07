import XCTest

/// One issue of the Olaf Messenger, opened from its tile: the lead story, a sideways shelf per
/// print section headed by "All ›", then the stories from no print section in a grid under More.
/// "All ›" opens a list of the section's stories from this issue, over the issue.
struct MessIssueScreen: Screen {
	let app: XCUIApplication

	/// Scroll the page a little way down, so a return to it can show whether it kept its place.
	@discardableResult
	func scrollDownALittle() -> Self {
		XCTAssertTrue(lead.waitForHittable(), "the issue should lead with a story")
		let low = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.7))
		let high = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
		// Slow, with a hold before release, so the page stops where the drag leaves it.
		low.press(forDuration: 0.05, thenDragTo: high, withVelocity: .slow, thenHoldForDuration: 0.3)
		return self
	}

	/// Open a section's list from its shelf's "All ›", check the list holds the issue's lead story
	/// among the section's, then go Back, and check the issue is where it was left.
	@discardableResult
	func openSectionHoldingTheLead(_ section: String) -> Self {
		XCTAssertTrue(lead.waitUntilExists(timeout: 30), "the issue should lead with a story")
		// The lead's label is its headline, then its section and writers.
		let headline = lead.label.components(separatedBy: ", \(section)").first ?? lead.label
		let all = app.buttons.matching(NSPredicate(format: "label == %@", "All \(section)")).firstMatch
		XCTAssertTrue(all.waitForHittable(timeout: 30), "the \(section) shelf should offer All")
		let before = all.frame
		capture("An issue, scrolled to its \(section) shelf")
		all.tap()

		let bar = app.navigationBars[section]
		XCTAssertTrue(bar.waitUntilExists(timeout: 30), "All should open a page titled \(section)")
		let leadRow = storyRows.matching(NSPredicate(format: "label BEGINSWITH %@", headline)).firstMatch
		XCTAssertTrue(
			leadRow.waitUntilExists(timeout: 30),
			"the \(section) list should hold the issue's lead story, \"\(headline)\"")
		capture("The issue's \(section) stories")

		bar.buttons[TestIdentifiers.Navigation.systemBackButton].tap()
		XCTAssertTrue(all.waitForHittable(timeout: 30), "Back should return to the issue")
		XCTAssertEqual(
			all.frame.minY, before.minY, accuracy: 1,
			"Back should leave the issue scrolled where it was")
		return self
	}

	/// Scroll down to the More grid and check its first row sets two cards side by side, each
	/// whole on the screen.
	@discardableResult
	func verifyMoreGridsItsStories() -> Self {
		let row = app.otherElements.matching(identifier: TestIdentifiers.News.moreGridRow).firstMatch
		scrollUntilExists(row, swipes: 10)
		XCTAssertTrue(row.waitUntilExists(timeout: 10), "the issue should end with the More grid")
		let cards = row.buttons.matching(identifier: TestIdentifiers.News.storyCard)
		XCTAssertEqual(cards.count, 2, "a row of the More grid should hold two cards")
		let first = cards.element(boundBy: 0).frame
		let second = cards.element(boundBy: 1).frame
		capture("The More grid")
		XCTAssertEqual(first.minY, second.minY, accuracy: 1, "a row's two cards should sit side by side")
		XCTAssertGreaterThan(second.minX, first.maxX, "a row's second card should follow its first")
		XCTAssertTrue(
			app.frame.contains(first) && app.frame.contains(second),
			"both of a row's cards should be whole on the screen, not cut off at its edge")
		return self
	}

	private var lead: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.News.leadStory).firstMatch
	}

	private var storyRows: XCUIElementQuery {
		app.messStoryRows
	}
}
