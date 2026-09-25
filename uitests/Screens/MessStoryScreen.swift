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
		let selected = app.buttons.matching(NSPredicate(format: "isSelected == true"))
		XCTAssertEqual(selected.count, 1, "only \(sign) should be marked as chosen")
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
	///
	/// The tap is retried, as `navigateFromHome` retries: Close is hittable as
	/// soon as its host mounts, but its action has to reach JavaScript, and a
	/// tap in between is dropped. Seen once by hand, just after the viewer
	/// appeared.
	@discardableResult
	func closeImageViewer() -> Self {
		for attempt in 1...3 {
			closeButton.tap()
			if closeButton.waitForNonExistence(timeout: 10) {
				break
			}
			XCTContext.runActivity(named: "Tap \(attempt) on Close did not dismiss the viewer; retrying") { _ in }
		}
		XCTAssertFalse(closeButton.exists, "Close should dismiss the zoom viewer")
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
