import XCTest

struct MessStoryScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func verifyStoryAppears() -> Self {
		let headline = app.staticTexts[TestIdentifiers.News.storyHeadline]
		XCTAssertTrue(headline.waitForExistence(timeout: 30), "the story's headline should be visible")
		capture("Olaf Messenger story")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.News.shareStory].waitForExistence(timeout: 10),
			"the reader should offer Share")
		// A story with no body text sends the reader to the website instead, so
		// either one proves the page below the header was drawn.
		let body = app.element(matching: TestIdentifiers.News.storyBody)
		let siteLink = app.element(matching: TestIdentifiers.News.storySiteLink)
		XCTAssertTrue(
			body.waitForExistence(timeout: 10) || siteLink.exists,
			"the story's body, or a link to read it on the web, should be below the header")
		return self
	}

	/// Pick a sign from a Horoscopes post's list of all twelve, which is what a
	/// reader who has never picked one sees. A row's label is the sign's name
	/// followed by its dates.
	@discardableResult
	func pickSignFromList(_ sign: String) -> Self {
		let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "\(sign), ")).firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 30), "a Horoscopes post should list \(sign) to pick")
		capture("Horoscopes before a sign is picked")
		row.tap()
		return self
	}

	/// Tap a sign's glyph in the grid a Horoscopes post shows once a sign is chosen.
	@discardableResult
	func tapSignGlyph(_ sign: String) -> Self {
		let glyph = app.buttons.matching(NSPredicate(format: "label == %@", sign)).firstMatch
		XCTAssertTrue(glyph.waitForExistence(timeout: 30), "the glyph grid should offer \(sign)")
		glyph.tap()
		return self
	}

	/// Assert the glyph grid marks this sign, and no other, as the chosen one.
	@discardableResult
	func verifySignChosen(_ sign: String) -> Self {
		let chosen = app.buttons.matching(
			NSPredicate(format: "label == %@ AND isSelected == true", sign)
		).firstMatch
		XCTAssertTrue(chosen.waitForExistence(timeout: 30), "\(sign) should be the chosen sign")
		capture("Horoscopes open on \(sign)")
		let selectedSigns = app.buttons.matching(
			NSPredicate(format: "label IN %@ AND isSelected == true", TestIdentifiers.News.signs))
		XCTAssertEqual(selectedSigns.count, 1, "only \(sign) should be marked as chosen")
		return self
	}

	/// Assert the page scrolled the chosen sign's section up to the navigation
	/// bar's bottom edge: the section opens with the glyph grid, so the grid's
	/// first row is where the section begins. A page that never scrolled leaves
	/// the grid wherever the rows it replaced were, above or below that edge.
	@discardableResult
	func verifyScrolledToChosenSign(_ sign: String) -> Self {
		let glyph = app.buttons.matching(NSPredicate(format: "label == %@", sign)).firstMatch
		let bar = app.navigationBars.firstMatch
		XCTAssertTrue(bar.waitForExistence(timeout: 10), "the reader should have a navigation bar")
		let landed = NSPredicate { _, _ in
			glyph.exists && abs(glyph.frame.minY - bar.frame.maxY) <= 1
		}
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: landed, object: nil)], timeout: 10)
		capture("Horoscopes scrolled to \(sign)")
		XCTAssertEqual(
			settled, .completed,
			"the grid should sit just below the navigation bar at \(bar.frame.maxY), not at \(glyph.frame.minY)")
		return self
	}

	/// Tap a comic or artwork's framed picture and wait for the zoom viewer.
	@discardableResult
	func openImageViewer() -> Self {
		let image = app.element(matching: TestIdentifiers.News.storyImage)
		XCTAssertTrue(image.waitForExistence(timeout: 30), "the story should draw its picture framed")
		capture("A comic in the reader")
		image.tap()
		let close = closeButton
		XCTAssertTrue(close.waitForExistence(timeout: 30), "tapping the picture should open the zoom viewer")
		capture("The zoom viewer")
		return self
	}

	/// Close the zoom viewer and wait to be back on the story.
	@discardableResult
	func closeImageViewer() -> Self {
		XCTAssertTrue(closeButton.waitForHittable(), "Close should be ready to tap")
		closeButton.tap()
		XCTAssertTrue(closeButton.waitForNonExistence(timeout: 30), "Close should dismiss the zoom viewer")
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.News.storyHeadline].waitForExistence(timeout: 10),
			"closing the viewer should return to the story")
		return self
	}

	/// The viewer's close button, by its identifier and the label VoiceOver reads.
	private var closeButton: XCUIElement {
		app.buttons.matching(
			NSPredicate(
				format: "identifier == %@ AND label == %@",
				TestIdentifiers.News.imageViewerClose, TestIdentifiers.News.imageViewerCloseLabel)
		).firstMatch
	}
}
