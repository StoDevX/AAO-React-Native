import XCTest

/// The Olaf Messenger's front page: the chips pinned under the navigation bar, Top's lead and
/// shelves, the Issues list, and a section's stories and columns.
struct MessFrontPage: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.olafMessenger)
	}

	/// Top leads with a story over at least one shelf of cards, under chips a reader can tap.
	@discardableResult
	func verifyTopShowsALeadAndAShelf() -> Self {
		XCTAssertTrue(lead.waitForExistence(timeout: 30), "Top should lead with a story")
		let card = app.buttons.matching(identifier: TestIdentifiers.News.storyCard).firstMatch
		XCTAssertTrue(card.waitForExistence(timeout: 30), "Top should show at least one shelf of stories")
		XCTAssertTrue(
			chip(TestIdentifiers.News.topChip).waitForHittable(),
			"the chips should sit below the navigation bar, where a tap reaches them")
		capture("The Messenger's Top page")
		verifyPaperNamedOnce()
		return self
	}

	/// The paper's name sits in the navigation bar, and the page under it does not repeat it.
	@discardableResult
	func verifyPaperNamedOnce() -> Self {
		let name = NSPredicate(format: "label == %@", TestIdentifiers.News.paperName)
		XCTAssertTrue(
			app.navigationBars.staticTexts.matching(name).firstMatch.waitForExistence(timeout: 10),
			"the navigation bar should name the paper")
		// The bar lists its own heading for the title and the text drawn inside it, so the name
		// is counted by where it sits rather than by how many times it appears.
		let bar = app.navigationBars.firstMatch.frame
		for element in app.staticTexts.matching(name).allElementsBoundByIndex {
			XCTAssertTrue(
				bar.contains(element.frame),
				"the paper's name should sit in the navigation bar, not again on the page (found at \(element.frame))")
		}
		return self
	}

	/// Choose a chip with one tap and wait for it to read as chosen. A chip that reads as
	/// selected means the page's JavaScript has drawn, so a tap then reaches it.
	@discardableResult
	func choose(chip label: String) -> Self {
		let chosen = chips.matching(NSPredicate(format: "isSelected == true")).firstMatch
		XCTAssertTrue(chosen.waitForExistence(timeout: 30), "the front page should show a chosen chip")
		let button = chip(label)
		scrollRow(chips, toReveal: button)
		XCTAssertTrue(button.waitForHittable(timeout: 10), "the \(label) chip should be ready to tap")
		button.tap()
		XCTAssertTrue(button.waitForSelected(true), "tapping \(label) should choose it")
		return self
	}

	/// Scroll the Issues list until it shows an issue from `year`, which the list reaches only by
	/// loading page after page as its end comes into view.
	@discardableResult
	func scrollIssues(untilAnIssueFrom year: String) -> Self {
		choose(chip: TestIdentifiers.News.issuesChip)
		let rows = app.buttons.matching(identifier: TestIdentifiers.News.issueRow)
		XCTAssertTrue(rows.firstMatch.waitForExistence(timeout: 30), "Issues should list the issues")
		let older = rows.matching(NSPredicate(format: "label CONTAINS %@", ", \(year),")).firstMatch
		let top = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
		let bottom = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.85))
		for _ in 0..<40 where !older.exists {
			bottom.press(forDuration: 0.05, thenDragTo: top)
		}
		capture("The Issues list, paged back to \(year)")
		XCTAssertTrue(
			older.waitForExistence(timeout: 30),
			"scrolling Issues should keep loading older pages until it reaches \(year)")
		return self
	}

	/// Open the Issues list's second issue and wait for its own page to lead with a story.
	@discardableResult
	func openSecondIssue() -> Self {
		choose(chip: TestIdentifiers.News.issuesChip)
		let second = app.buttons.matching(identifier: TestIdentifiers.News.issueRow).element(boundBy: 1)
		XCTAssertTrue(second.waitForExistence(timeout: 30), "Issues should list at least two issues")
		capture("The Messenger's Issues list")
		XCTAssertTrue(second.waitForHittable(), "the second issue should be ready to tap")
		second.tap()
		XCTAssertTrue(
			chips.firstMatch.waitForNonExistence(timeout: 30),
			"tapping an issue should open it on a page of its own")
		XCTAssertTrue(lead.waitForExistence(timeout: 30), "an opened issue should lead with a story")
		capture("An older issue of the Messenger")
		return self
	}

	/// Choose a section's chip, then open one of its columns from the row of column chips at the
	/// top of the section, and wait for the column's list.
	@discardableResult
	func openColumn(_ column: String, in section: String) -> Self {
		choose(chip: section)
		let columns = app.buttons.matching(identifier: TestIdentifiers.News.columnChip)
		let button = columns.matching(NSPredicate(format: "label == %@", column)).firstMatch
		XCTAssertTrue(button.waitForExistence(timeout: 30), "\(section) should offer its \(column) column")
		scrollRow(columns, toReveal: button)
		XCTAssertTrue(button.waitForHittable(timeout: 10), "the \(column) chip should be ready to tap")
		capture("\(section) and its columns")
		button.tap()
		XCTAssertTrue(
			chips.firstMatch.waitForNonExistence(timeout: 30),
			"tapping a column should open its list on a page of its own")
		XCTAssertTrue(storyRows.firstMatch.waitForExistence(timeout: 30), "the \(column) list should show its stories")
		return self
	}

	/// Open the lead story in the reader.
	@discardableResult
	func openLeadStory() -> MessStoryScreen {
		XCTAssertTrue(lead.waitForHittable(), "the lead story should be ready to tap")
		lead.tap()
		return MessStoryScreen(app: app)
	}

	/// Open the first story of a section's or column's list in the reader.
	@discardableResult
	func openFirstStory() -> MessStoryScreen {
		let row = storyRows.firstMatch
		XCTAssertTrue(row.waitForHittable(), "a story row should be ready to tap")
		row.tap()
		return MessStoryScreen(app: app)
	}

	/// Drag a row of chips sideways until `button` is on screen. A row scrolls on its own, and a
	/// chip past its edge is in the tree but cannot take a tap. Its frame is read rather than
	/// `isHittable`, which fails the test outright for a chip off screen. Each drag heads toward
	/// the chip, slowly and with a hold before release, so the row does not coast past it at large
	/// text sizes; press-then-drag, as a plain swipe can be taken for a tap on the chip under it.
	private func scrollRow(_ row: XCUIElementQuery, toReveal button: XCUIElement) {
		let rowY = row.firstMatch.frame.midY
		let origin = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
		let right = origin.withOffset(CGVector(dx: app.frame.width * 0.8, dy: rowY))
		let left = origin.withOffset(CGVector(dx: app.frame.width * 0.2, dy: rowY))
		for _ in 0..<10 where !app.frame.contains(button.frame) {
			let (start, end) = button.frame.midX > app.frame.midX ? (right, left) : (left, right)
			start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
		}
	}

	private var chips: XCUIElementQuery {
		app.buttons.matching(identifier: TestIdentifiers.News.chip)
	}

	private func chip(_ label: String) -> XCUIElement {
		chips.matching(NSPredicate(format: "label == %@", label)).firstMatch
	}

	private var lead: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.News.leadStory).firstMatch
	}

	private var storyRows: XCUIElementQuery {
		app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.storyRowPrefix))
	}
}
