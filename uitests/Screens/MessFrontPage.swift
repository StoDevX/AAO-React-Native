import XCTest

/// The Olaf Messenger's front page: a navigation bar with no title and a view menu at its right,
/// over the paper's masthead; then the grid of issues with the newest on top, or Latest's stories,
/// which the menu narrows to one section and its columns.
struct MessFrontPage: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		viewMenu
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/messenger", mountedWhen: mounted)
	}

	/// By Issue leads with the newest issue as the top tile, over older issues as tiles, under the
	/// paper's masthead.
	@discardableResult
	func verifyByIssueShowsTheGrid() -> Self {
		XCTAssertTrue(topTile.waitForExistence(timeout: 30), "By Issue should lead with the newest issue")
		XCTAssertTrue(tiles.firstMatch.waitForExistence(timeout: 30), "By Issue should show older issues as tiles")
		XCTAssertTrue(
			viewMenu.waitForLabel(viewMenuLabel(TestIdentifiers.News.byIssue), timeout: 10),
			"By Issue should be the view chosen (the menu reads \(viewMenu.label))")
		capture("The Messenger's By Issue grid")
		verifyPaperNamedOnce()
		return self
	}

	/// Wait for the thumbnails to show, then attach a screenshot of them.
	func captureGrid(_ name: String) {
		XCTAssertTrue(topTile.waitForExistence(timeout: 30), "the grid should show its top tile")
		// Tiles redraw their cached image after a setting changes.
		Thread.sleep(forTimeInterval: 1.5)
		capture(name)
	}

	/// Tap the paintbrush at the top right and wait for the Customize sheet.
	@discardableResult
	func openCustomize() -> MessCustomizeScreen {
		let button = app.buttons[TestIdentifiers.MessCustomize.paintbrush]
		XCTAssertTrue(button.waitForHittable(timeout: 30), "the front page should have a Customize button")
		capture("The Messenger's front page, with its paintbrush")
		button.tap()
		return MessCustomizeScreen(app: app).checkOpen()
	}

	/// The navigation bar has no title, and the paper's castle heads the page as its masthead,
	/// read as the paper's name; the name is printed only on the issues' own nameplates.
	@discardableResult
	func verifyPaperNamedOnce() -> Self {
		let name = NSPredicate(format: "label == %@", TestIdentifiers.News.paperName)
		XCTAssertTrue(
			app.images.matching(name).firstMatch.waitForExistence(timeout: 10),
			"the page should carry the paper's castle as its masthead")
		XCTAssertEqual(
			app.navigationBars.staticTexts.count, 0,
			"the navigation bar should have no title; the masthead names the paper")
		// Each tile prints the name as its nameplate; VoiceOver reads a tile by its label alone, but
		// XCUITest still lists the text inside it, so the name is counted outside the tiles.
		let nameplates = (tiles.allElementsBoundByIndex + [topTile]).map(\.frame)
		let outsideTiles = app.staticTexts.matching(name).allElementsBoundByIndex
			.filter { element in !nameplates.contains(where: { $0.contains(element.frame) }) }
		XCTAssertEqual(outsideTiles.count, 0, "the page should print the paper's name only on its tiles")
		return self
	}

	/// Pick a view from the menu at the top right, unless it shows already, and wait for the menu
	/// to name it.
	@discardableResult
	func choose(view label: String) -> Self {
		XCTAssertTrue(viewMenu.waitForHittable(timeout: 30), "the view menu should be ready to tap")
		if viewMenu.label == viewMenuLabel(label) { return self }
		pickFromViewMenu(label)
		XCTAssertTrue(
			viewMenu.waitForLabel(viewMenuLabel(label), timeout: 10),
			"picking \(label) should show it (the menu reads \(viewMenu.label))")
		return self
	}

	/// Narrow Latest to a section from the view menu, and wait for the dateline to name the section.
	@discardableResult
	func filterLatest(to section: String) -> Self {
		choose(view: TestIdentifiers.News.latest)
		pickFromViewMenu(section)
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
			viewMenu.waitForNonExistence(timeout: 30),
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
			viewMenu.waitForNonExistence(timeout: 30),
			"tapping a column should open its list on a page of its own")
		XCTAssertTrue(storyRows.firstMatch.waitForExistence(timeout: 30), "the \(column) list should show its stories")
		return self
	}

	/// Open the newest issue from its tile, and wait for its page to lead with a story.
	@discardableResult
	func openNewestIssue() -> MessIssueScreen {
		XCTAssertTrue(topTile.waitForHittable(), "the newest issue's tile should be ready to tap")
		topTile.tap()
		XCTAssertTrue(lead.waitForExistence(timeout: 30), "the newest issue should lead with a story")
		return MessIssueScreen(app: app)
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

	/// Open the paper's About page from the view menu, and wait for it to list someone to write
	/// to, by the address a row names, and its submission policy.
	@discardableResult
	func openAbout() -> Self {
		pickFromViewMenu(TestIdentifiers.News.aboutMenuItem)
		XCTAssertTrue(
			viewMenu.waitForNonExistence(timeout: 30),
			"About should open the About page on a page of its own")
		let title = app.navigationBars.staticTexts[TestIdentifiers.News.aboutTitle].firstMatch
		XCTAssertTrue(
			title.waitForExistence(timeout: 30),
			"the About page should be titled \(TestIdentifiers.News.aboutTitle)")
		let contact = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "@stolaf.edu")).firstMatch
		XCTAssertTrue(contact.waitForExistence(timeout: 30), "the About page should list someone to write to")
		capture("The Messenger's About page")
		XCTAssertTrue(contact.isHittable, "a contact's row should be ready to tap")
		// The list is lazy, so the heading is in the tree only while near the screen: swipe until
		// it is, rather than a fixed number of times, which can scroll past it.
		let policy = app.staticTexts[TestIdentifiers.News.submissionPolicy].firstMatch
		for _ in 0..<6 where !policy.exists {
			app.swipeUp(velocity: .slow)
		}
		XCTAssertTrue(policy.waitForExistence(timeout: 10), "the About page should end with its submission policy")
		capture("The Messenger's submission policy")
		return self
	}

	/// Tap the first row of the Crossword column's list and assert it opens the puzzle in the
	/// in-app browser, with no story page between.
	@discardableResult
	func solveFirstCrossword() -> Self {
		let row = storyRows.firstMatch
		XCTAssertTrue(row.waitForHittable(), "a crossword row should be ready to tap")
		row.tap()
		let done = app.buttons[TestIdentifiers.Directory.inAppBrowserDone].firstMatch
		XCTAssertTrue(
			done.waitForExistence(timeout: 30),
			"a crossword's row should open its puzzle in the in-app browser")
		capture("A crossword from its row, in the in-app browser")
		return self
	}

	/// Open the view menu and tap its item named `label`.
	private func pickFromViewMenu(_ label: String) {
		XCTAssertTrue(viewMenu.waitForHittable(timeout: 30), "the view menu should be ready to tap")
		viewMenu.tap()
		let item = menuItem(label)
		XCTAssertTrue(waitForOnScreen(item, timeout: 10), "the view menu should offer \(label)")
		tapCentre(item)
		// A menu holding checkmarks can stay open after a pick; close it if it did.
		if item.exists { closeMenu() }
	}

	/// Close an open menu with a tap outside it, at the top left of the masthead, where a tap
	/// opens nothing.
	private func closeMenu() {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.2)).tap()
	}

	/// Wait for `element` to exist with its frame inside the window and holding still. A menu's
	/// rows move while the menu opens, so a frame read too soon lands a tap on the row next to the
	/// one meant.
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

	/// Tap the middle of `element`'s frame, for a menu row XCUITest will not call hittable.
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

	/// The glass button at the top right, labelled by the view it shows.
	private var viewMenu: XCUIElement {
		app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.News.viewMenuPrefix)).firstMatch
	}

	private func viewMenuLabel(_ view: String) -> String {
		TestIdentifiers.News.viewMenuPrefix + view
	}

	/// An item of an open menu: anything but the text inside it, which shares its label.
	private func menuItem(_ label: String) -> XCUIElement {
		app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@ AND elementType != %d", label, XCUIElement.ElementType.staticText.rawValue))
			.firstMatch
	}

	private var lead: XCUIElement {
		app.buttons.matching(identifier: TestIdentifiers.News.leadStory).firstMatch
	}

	var storyRows: XCUIElementQuery {
		app.messStoryRows
	}
}

extension XCUIApplication {
	/// The Mess's story rows. A row into the reader is a button, but one that leaves the app -- a
	/// puzzle's -- reads as a link, so XCUITest lists it under `links`, not `buttons`.
	var messStoryRows: XCUIElementQuery {
		descendants(matching: .any).matching(
			NSPredicate(
				format: "identifier BEGINSWITH %@ AND (elementType == %d OR elementType == %d)",
				TestIdentifiers.News.storyRowPrefix,
				XCUIElement.ElementType.button.rawValue,
				XCUIElement.ElementType.link.rawValue))
	}
}
