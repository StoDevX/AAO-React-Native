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

	/// The headline of the story on top, once one other than `previous` is drawn.
	func headline(otherThan previous: String? = nil) -> String {
		let headline = headlineText
		let drawn = NSPredicate { _, _ in headline.exists && headline.label != previous }
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: drawn, object: nil)], timeout: 30)
		XCTAssertEqual(
			settled, .completed,
			previous.map { "a story other than \"\($0)\" should open" } ?? "a story's headline should be visible")
		return headline.label
	}

	/// Assert the story on top is the one headlined `expected`.
	@discardableResult
	func verifyHeadline(_ expected: String, _ message: String) -> Self {
		let headline = headlineText
		let drawn = NSPredicate { _, _ in headline.exists && headline.label == expected }
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: drawn, object: nil)], timeout: 30)
		capture("The story on top, expecting \(expected)")
		XCTAssertEqual(
			settled, .completed,
			"\(message): expected \"\(expected)\" on top, but found \(headline.exists ? "\"\(headline.label)\"" : "no story")")
		return self
	}

	/// Scroll down to the row of related stories under a story and open one: the one
	/// titled `title`, or the first.
	@discardableResult
	func openSeriesStory(titled title: String? = nil) -> Self {
		let thumbnails = app.buttons.matching(identifier: TestIdentifiers.News.seriesStory)
		let thumbnail =
			title.map { thumbnails.matching(NSPredicate(format: "label CONTAINS %@", $0)).firstMatch }
			?? thumbnails.firstMatch
		for _ in 0..<20 {
			if thumbnail.exists && thumbnail.isHittable { break }
			app.swipeUp()
		}
		XCTAssertTrue(
			thumbnail.waitForHittable(timeout: 10),
			title.map { "the series row should offer \"\($0)\"" } ?? "the story should have a series row")
		capture("A story's series row")
		thumbnail.tap()
		return self
	}

	/// Go back one screen with the navigation bar's back button.
	@discardableResult
	func goBack() -> Self {
		let back = app.navigationBars.firstMatch.buttons[TestIdentifiers.Navigation.systemBackButton]
		XCTAssertTrue(back.waitForHittable(timeout: 10), "the story should offer a way back")
		back.tap()
		return self
	}

	/// Long-press the story's first paragraph and assert iOS offers to copy it,
	/// which it does only for text that can be selected.
	@discardableResult
	func verifyBodyOffersCopy() -> Self {
		let body = app.element(matching: TestIdentifiers.News.storyBody)
		XCTAssertTrue(body.waitForExistence(timeout: 10), "the story should have a paragraph to long-press")
		body.press(forDuration: 1.0)
		let copy = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Copy")).firstMatch
		let offered = copy.waitForExistence(timeout: 5)
		capture("Long press on a story paragraph")
		XCTAssertTrue(offered, "a long press on a story's paragraph should offer Copy")
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

	/// Scroll down the page until a sign's row is on screen, which at a large
	/// text size carries the chosen sign's section, if any, well out of sight.
	@discardableResult
	func scrollToSignRow(_ sign: String) -> Self {
		let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "\(sign), ")).firstMatch
		for _ in 0..<20 {
			if row.exists && row.isHittable { break }
			app.swipeUp()
		}
		XCTAssertTrue(row.waitForHittable(timeout: 10), "scrolling down should reach the \(sign) row")
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
	/// The first glyph marks that row whichever sign is chosen; the chosen
	/// sign's own glyph may be in the second.
	@discardableResult
	func verifyScrolledToChosenSign(_ sign: String) -> Self {
		let firstSign = TestIdentifiers.News.signs[0]
		let glyph = app.buttons.matching(NSPredicate(format: "label == %@", firstSign)).firstMatch
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

	/// Double-tap the middle of the picture in the zoom viewer.
	@discardableResult
	func doubleTapViewerImage() -> Self {
		let image = viewerImage
		XCTAssertTrue(image.waitForExistence(timeout: 30), "the zoom viewer should show the picture")
		image.doubleTap()
		return self
	}

	/// Spread two fingers on the picture in the zoom viewer.
	@discardableResult
	func pinchOutViewerImage() -> Self {
		let image = viewerImage
		XCTAssertTrue(image.waitForExistence(timeout: 30), "the zoom viewer should show the picture")
		image.pinch(withScale: 3, velocity: 1)
		return self
	}

	/// Assert the picture is drawn wider than the window, as a zoom in leaves it,
	/// or back to the window's width, as it opens at 1×.
	@discardableResult
	func verifyViewerImageZoomed(_ zoomed: Bool) -> Self {
		let image = viewerImage
		let window = app.windows.firstMatch.frame.width
		let landed = NSPredicate { _, _ in
			let width = image.frame.width
			return zoomed ? width > window * 1.5 : abs(width - window) <= 1
		}
		let settled = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: landed, object: nil)], timeout: 10)
		capture(zoomed ? "The zoom viewer zoomed in" : "The zoom viewer back at fit")
		XCTAssertEqual(
			settled, .completed,
			zoomed
				? "a double tap should zoom the picture in past the window's width of \(window), but it is \(image.frame.width) wide"
				: "a double tap when zoomed in should fit the picture back to the window's width of \(window), but it is \(image.frame.width) wide")
		return self
	}

	/// The headline of the story on top.
	private var headlineText: XCUIElement {
		app.staticTexts[TestIdentifiers.News.storyHeadline]
	}

	/// The picture in the zoom viewer.
	private var viewerImage: XCUIElement {
		app.element(matching: TestIdentifiers.News.imageViewerImage)
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
