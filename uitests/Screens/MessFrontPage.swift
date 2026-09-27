import XCTest

/// The Olaf Messenger's front page: the By Issue / Latest switch pinned under the navigation bar,
/// the grid of issues with the newest on top, and Latest's stories with a filter that narrows them
/// to one section and its columns.
struct MessFrontPage: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.olafMessenger)
	}

	/// By Issue leads with the newest issue as the top tile, over older issues as tiles, and keeps
	/// the section filter for Latest.
	@discardableResult
	func verifyByIssueShowsTheGrid() -> Self {
		XCTAssertTrue(topTile.waitForExistence(timeout: 30), "By Issue should lead with the newest issue")
		XCTAssertTrue(tiles.firstMatch.waitForExistence(timeout: 30), "By Issue should show older issues as tiles")
		XCTAssertTrue(
			segment(TestIdentifiers.News.byIssue).waitForSelected(true),
			"By Issue should be the view chosen")
		XCTAssertFalse(filter.exists, "the section filter belongs to Latest only")
		capture("The Messenger's By Issue grid")
		verifyPaperNamedOnce()
		return self
	}

	/// The paper's name sits in the navigation bar, and the page under it does not repeat it
	/// outside the issues' own nameplates.
	@discardableResult
	func verifyPaperNamedOnce() -> Self {
		let name = NSPredicate(format: "label == %@", TestIdentifiers.News.paperName)
		XCTAssertTrue(
			app.navigationBars.staticTexts.matching(name).firstMatch.waitForExistence(timeout: 10),
			"the navigation bar should name the paper")
		// The bar lists its own heading for the title and the text drawn inside it, so the name
		// is counted by where it sits rather than by how many times it appears. Each tile prints
		// the name as its nameplate; VoiceOver reads a tile by its label alone, but XCUITest
		// still lists the text inside it.
		let bar = app.navigationBars.firstMatch.frame
		let nameplates = (tiles.allElementsBoundByIndex + [topTile]).map(\.frame)
		for element in app.staticTexts.matching(name).allElementsBoundByIndex {
			let frame = element.frame
			if nameplates.contains(where: { $0.contains(frame) }) { continue }
			XCTAssertTrue(
				bar.contains(frame),
				"the paper's name should sit in the navigation bar, not again on the page (found at \(frame))")
		}
		return self
	}

	/// Choose a segment of the switch with one tap and wait for it to read as chosen.
	@discardableResult
	func choose(view label: String) -> Self {
		let button = segment(label)
		XCTAssertTrue(button.waitForHittable(timeout: 30), "the \(label) segment should be ready to tap")
		button.tap()
		XCTAssertTrue(button.waitForSelected(true), "tapping \(label) should choose it")
		return self
	}

	/// Latest lists stories, with its section filter in the toolbar.
	@discardableResult
	func verifyLatestListsStoriesWithAFilter() -> Self {
		choose(view: TestIdentifiers.News.latest)
		XCTAssertTrue(storyRows.firstMatch.waitForExistence(timeout: 30), "Latest should list stories")
		XCTAssertTrue(waitForOnScreen(filter), "Latest should offer its section filter")
		capture("The Messenger's Latest stories")
		return self
	}

	/// Narrow Latest to a section with its filter, and wait for the dateline to name the section.
	@discardableResult
	func filterLatest(to section: String) -> Self {
		choose(view: TestIdentifiers.News.latest)
		XCTAssertTrue(waitForOnScreen(filter), "Latest should offer its section filter")
		tapCentre(filter)
		let option = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@ AND elementType != %d", section, XCUIElement.ElementType.staticText.rawValue))
			.firstMatch
		XCTAssertTrue(waitForOnScreen(option, timeout: 10), "the filter should offer \(section)")
		tapCentre(option)
		// The menu stays open while a reader chooses; a tap outside it closes it.
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
		let dateline = app.staticTexts.matching(identifier: TestIdentifiers.News.dateline).firstMatch
		XCTAssertTrue(
			dateline.waitForLabel(section, timeout: 30),
			"Latest should now show \(section) (its dateline reads \(dateline.label))")
		capture("Latest narrowed to \(section)")
		return self
	}

	/// Scroll the grid until it shows an issue from `year`, which it reaches only by loading page
	/// after page as its end comes into view.
	@discardableResult
	func scrollIssues(untilAnIssueFrom year: String) -> Self {
		XCTAssertTrue(tiles.firstMatch.waitForExistence(timeout: 30), "By Issue should show its tiles")
		let older = tiles.matching(NSPredicate(format: "label CONTAINS %@", ", \(year),")).firstMatch
		let top = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
		let bottom = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.85))
		for _ in 0..<60 where !older.exists {
			bottom.press(forDuration: 0.05, thenDragTo: top)
		}
		capture("The issue grid, paged back to \(year)")
		XCTAssertTrue(
			older.waitForExistence(timeout: 30),
			"scrolling should keep loading older issues until it reaches \(year)")
		return self
	}

	/// Open the first tile under the top one and wait for its issue's page to lead with a story.
	@discardableResult
	func openSecondIssue() -> Self {
		let second = tiles.firstMatch
		XCTAssertTrue(second.waitForExistence(timeout: 30), "By Issue should show a tile under the top one")
		XCTAssertTrue(second.waitForHittable(), "the tile should be ready to tap")
		second.tap()
		XCTAssertTrue(
			segment(TestIdentifiers.News.byIssue).waitForNonExistence(timeout: 30),
			"tapping a tile should open its issue on a page of its own")
		XCTAssertTrue(lead.waitForExistence(timeout: 30), "an opened issue should lead with a story")
		capture("An older issue of the Messenger")
		return self
	}

	/// Narrow Latest to a section, then open one of its columns from the row of column chips at
	/// the top, and wait for the column's list.
	@discardableResult
	func openColumn(_ column: String, in section: String) -> Self {
		filterLatest(to: section)
		return openColumn(column, inShown: section)
	}

	/// Open a column of the section Latest already shows -- one the app remembered from before it
	/// was relaunched -- from the row of column chips at the top, and wait for the column's list.
	@discardableResult
	func openColumn(_ column: String, inShown section: String) -> Self {
		choose(view: TestIdentifiers.News.latest)
		let dateline = app.staticTexts.matching(identifier: TestIdentifiers.News.dateline).firstMatch
		XCTAssertTrue(
			dateline.waitForLabel(section, timeout: 30),
			"Latest should still show \(section) (its dateline reads \(dateline.label))")
		let columns = app.buttons.matching(identifier: TestIdentifiers.News.columnChip)
		let button = columns.matching(NSPredicate(format: "label == %@", column)).firstMatch
		XCTAssertTrue(button.waitForExistence(timeout: 30), "\(section) should offer its \(column) column")
		scrollRow(columns, toReveal: button)
		XCTAssertTrue(button.waitForHittable(timeout: 10), "the \(column) chip should be ready to tap")
		capture("\(section) and its columns")
		button.tap()
		XCTAssertTrue(
			segment(TestIdentifiers.News.latest).waitForNonExistence(timeout: 30),
			"tapping a column should open its list on a page of its own")
		XCTAssertTrue(storyRows.firstMatch.waitForExistence(timeout: 30), "the \(column) list should show its stories")
		return self
	}

	/// Open the newest issue from its tile, then its lead story in the reader.
	@discardableResult
	func openLeadStory() -> MessStoryScreen {
		XCTAssertTrue(topTile.waitForHittable(), "the newest issue's tile should be ready to tap")
		topTile.tap()
		XCTAssertTrue(lead.waitForHittable(), "the newest issue should lead with a story")
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

	/// Wait for `element` to exist with its frame inside the window and holding still. A button
	/// hosted in the bottom toolbar sits under views that report no frame, so XCUITest never calls
	/// it hittable although a finger reaches it; its own frame is the check that it is on screen. A
	/// menu's rows move while the menu opens, so a frame read too soon lands a tap on the row next
	/// to the one meant.
	private func waitForOnScreen(_ element: XCUIElement, timeout: TimeInterval = 30) -> Bool {
		guard element.waitForExistence(timeout: timeout) else { return false }
		var last = CGRect.null
		let settled = NSPredicate { _, _ in
			let frame = element.frame
			defer { last = frame }
			return !frame.isEmpty && self.app.frame.contains(frame) && frame == last
		}
		let expectation = XCTNSPredicateExpectation(predicate: settled, object: nil)
		return XCTWaiter().wait(for: [expectation], timeout: timeout) == .completed
	}

	/// Tap the middle of `element`'s frame, for a button XCUITest will not call hittable.
	private func tapCentre(_ element: XCUIElement) {
		element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
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

	private var topTile: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.News.topTile).firstMatch
	}

	private var tiles: XCUIElementQuery {
		app.buttons.matching(identifier: TestIdentifiers.News.issueTile)
	}

	private var filter: XCUIElement {
		app.buttons[TestIdentifiers.News.sectionFilter].firstMatch
	}

	private func segment(_ label: String) -> XCUIElement {
		app.segmentedControls.buttons[label].firstMatch
	}

	private var lead: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.News.leadStory).firstMatch
	}

	private var storyRows: XCUIElementQuery {
		app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.storyRowPrefix))
	}
}
