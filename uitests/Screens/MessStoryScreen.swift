import XCTest

struct MessStoryScreen: Screen {
	let app: XCUIApplication

	/// Wait for a story's headline, for a story with no body text to check, as a Photo story is.
	@discardableResult
	func verifyHeadlineAppears() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.News.storyHeadline].waitUntilExists(timeout: 30),
			"the story's headline should be visible")
		return self
	}

	/// Wait until the paper beside the column, below the bars, reads as dark or as light. A
	/// screenshot that can't be read fails the check rather than counting as light.
	@discardableResult
	func verifyPage(dark: Bool, _ message: String) -> Self {
		var brightness: Int?
		let settled = waitUntil("Waiting 10.0s for the paper to read \(dark ? "dark" : "light")", timeout: 10) {
			guard let pixels = ScreenPixels(app.screenshot().image) else { return false }
			let paper = pixels.colour(at: CGPoint(x: 6, y: app.windows.firstMatch.frame.midY))
			brightness = (paper.red + paper.green + paper.blue) / 3
			return (brightness! < 80) == dark
		}
		XCTAssertTrue(
			settled,
			"\(message) (the paper's brightness read \(brightness.map(String.init) ?? "nothing"))")
		return self
	}

	/// The headline of the story on top, once one other than `previous` is drawn.
	/// Mid-push or mid-pop both screens' headlines are in the tree, and reading a
	/// label then fails on the ambiguous match, so this waits until only one is.
	func headline(otherThan previous: String? = nil) -> String {
		let headlines = headlineTexts
		let settled = waitUntil("Waiting 30.0s for one story headline", timeout: 30) {
			headlines.count == 1 && headlines.firstMatch.label != previous
		}
		XCTAssertTrue(
			settled,
			previous.map { "a story other than \"\($0)\" should open" } ?? "a story's headline should be visible")
		return headlines.firstMatch.label
	}

	/// Assert the story on top is the one headlined `expected`. The match is by
	/// identifier and label together, so it holds while a transition leaves two
	/// headlines in the tree.
	@discardableResult
	func verifyHeadline(_ expected: String, _ message: String) -> Self {
		let headline = app.staticTexts
			.matching(NSPredicate(
				format: "identifier == %@ AND label == %@", TestIdentifiers.News.storyHeadline, expected))
			.firstMatch
		let drawn = headline.waitUntilExists(timeout: 30)
		let found = headlineTexts.allElementsBoundByIndex.map { "\"\($0.label)\"" }
		XCTAssertTrue(
			drawn,
			"\(message): expected \"\(expected)\" on top, but found \(found.isEmpty ? "no story" : found.joined(separator: ", "))")
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
		thumbnail.tap()
		return self
	}

	/// Hold the first line of the story's body and drag down into its second paragraph, then
	/// assert the selection's highlight runs unbroken down the column's trailing edge from the
	/// first paragraph's second line, past the gap between the paragraphs, into the second's
	/// first line. On an iPhone 17e at the default text size the illustrated story's first
	/// paragraph ends about 120 points below its first line and its second begins about 138
	/// points below; a selection ends about a line above the finger, so the drag goes 200
	/// points down. The highlight is read from the screen because the test runner, in the
	/// background, may not read the pasteboard.
	@discardableResult
	func verifySelectionCrossesParagraphs() -> Self {
		let body = app.element(matching: TestIdentifiers.News.storyBody)
		XCTAssertTrue(body.waitUntilExists(timeout: 30), "the story should have a body to select")
		scrollIntoUpperHalf(body)
		let start = body.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 40, dy: 10))
		let end = start.withOffset(CGVector(dx: 120, dy: 200))
		start.press(forDuration: 1.0, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.5)
		let copy = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", TestIdentifiers.EditMenu.copy)).firstMatch
		let offered = copy.waitUntilExists(timeout: 5)
		XCTAssertTrue(offered, "a drag across the story's text should select some of it, and offer Copy")

		guard let pixels = ScreenPixels(app.screenshot().image) else {
			XCTFail("the screenshot should be readable")
			return self
		}
		// The trailing edge, where ragged lines leave the highlight mostly clear of glyphs.
		let trailingEdge = CGRect(
			x: body.frame.maxX - 6, y: start.screenPoint.y + 20, width: 4, height: 130)
		let highlighted = fractionHighlighted(pixels, in: trailingEdge)
		XCTAssertGreaterThan(
			highlighted, 0.9,
			"the selection should run from the first paragraph into the second, but it covers only \(Int(highlighted * 100))% of the column's edge between them")
		return self
	}

	/// The share of `region` drawn in the selection's highlight, a pale blue no paper or ink
	/// colour comes near, sampled every two points.
	private func fractionHighlighted(_ pixels: ScreenPixels, in region: CGRect) -> Double {
		var sampled = 0
		var highlighted = 0
		for y in stride(from: region.minY, to: region.maxY, by: 2) {
			for x in stride(from: region.minX, to: region.maxX, by: 2) {
				let colour = pixels.colour(at: CGPoint(x: x, y: y))
				sampled += 1
				if colour.blue - colour.red > 25 { highlighted += 1 }
			}
		}
		return sampled == 0 ? 0 : Double(highlighted) / Double(sampled)
	}

	/// Tap a link in the story's text and assert it opens in the in-app browser, then close it.
	@discardableResult
	func openLinkInAppBrowser(_ label: String) -> Self {
		let link = storyLink(label)
		XCTAssertTrue(link.waitForHittable(timeout: 10), "the link \"\(label)\" should be ready to tap")
		link.tap()
		let done = app.buttons[TestIdentifiers.Browser.done].firstMatch
		XCTAssertTrue(done.waitUntilExists(timeout: 30), "tapping a story's link should open the in-app browser")
		done.tap()
		XCTAssertTrue(done.waitUntilGone(timeout: 10), "Done should close the in-app browser")
		return self
	}

	/// Hold a link in the story's text and assert iOS offers its link menu, not the menu for
	/// selected text.
	@discardableResult
	func verifyLinkOffersLinkMenu(_ label: String) -> Self {
		let link = storyLink(label)
		XCTAssertTrue(link.waitForHittable(timeout: 10), "the link \"\(label)\" should be ready to hold")
		// Press the link's screen point through SpringBoard rather than pressing
		// the link itself. The menu's preview loads the linked page live, and
		// the app never goes quiet while it does, so a press on our own app
		// waits out XCUITest's full 60s quiescence timeout after landing.
		// SpringBoard is quiet, and the point is the same point.
		let target = link.frame
		XCUIApplication(bundleIdentifier: TestIdentifiers.SpringBoard.bundleIdentifier)
			.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: target.midX, dy: target.midY))
			.press(forDuration: 1.5)
		let copyLink = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@", TestIdentifiers.News.copyLink)).firstMatch
		let offered = copyLink.waitUntilExists(timeout: 5)
		XCTAssertTrue(offered, "holding a link in a story should offer \(TestIdentifiers.News.copyLink)")
		return self
	}

	/// The link in the story's text with these words, scrolled into view.
	private func storyLink(_ label: String) -> XCUIElement {
		let link = app.links.matching(NSPredicate(format: "label == %@", label)).firstMatch
		XCTAssertTrue(link.waitUntilExists(timeout: 30), "the story should hold the link \"\(label)\"")
		scrollIntoUpperHalf(link)
		return link
	}

	/// Drag the page slowly until `element` begins in the upper half of the screen, below the
	/// navigation bar. A slow, held drag moves the page by about its own length, where a
	/// swipe flings it past.
	private func scrollIntoUpperHalf(_ element: XCUIElement) {
		let window = app.windows.firstMatch.frame
		let top = app.navigationBars.firstMatch.frame.maxY
		for _ in 0..<10 {
			if element.frame.minY > top && element.frame.minY < window.midY { return }
			let from = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.75))
			let to = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
			from.press(forDuration: 0.05, thenDragTo: to, withVelocity: .slow, thenHoldForDuration: 0.3)
		}
		XCTAssertTrue(
			element.frame.minY > top && element.frame.minY < window.midY,
			"scrolling should bring \(element) into the top half of the screen, but it begins at \(element.frame.minY)")
	}

	/// Pick a sign from a Horoscopes post's list of all twelve, which is what a
	/// reader who has never picked one sees. A row's label is the sign's name
	/// followed by its dates.
	@discardableResult
	func pickSignFromList(_ sign: String) -> Self {
		let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "\(sign), ")).firstMatch
		XCTAssertTrue(row.waitUntilExists(timeout: 30), "a Horoscopes post should list \(sign) to pick")
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
		XCTAssertTrue(glyph.waitUntilExists(timeout: 30), "the glyph grid should offer \(sign)")
		glyph.tap()
		return self
	}

	/// Tap a sign's glyph in the grid, which sits below the navigation bar, and assert the
	/// sign is chosen and the page did not scroll: the grid's first row stays where it was.
	@discardableResult
	func tapSignGlyphKeepingThePlace(_ sign: String) -> Self {
		let firstGlyph = app.buttons.matching(
			NSPredicate(format: "label == %@", TestIdentifiers.News.signs[0])
		).firstMatch
		let bar = app.navigationBars.firstMatch
		XCTAssertTrue(firstGlyph.waitUntilExists(timeout: 30), "the glyph grid should be drawn")
		XCTAssertTrue(bar.waitUntilExists(timeout: 10), "the reader should have a navigation bar")
		let before = firstGlyph.frame.minY
		// A grid already at the bar's edge would stay put whether the page scrolled or not.
		XCTAssertGreaterThan(
			before, bar.frame.maxY + 1,
			"the grid should open below the navigation bar, at \(before), so a scroll would show")
		tapSignGlyph(sign)
		verifySignChosen(sign)
		let moved = NSPredicate { _, _ in abs(firstGlyph.frame.minY - before) > 1 }
		let result = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: moved, object: nil)], timeout: 3)
		XCTAssertEqual(
			result, .timedOut,
			"picking \(sign) from the grid should leave the grid at \(before), not move it to \(firstGlyph.frame.minY)")
		return self
	}

	/// Assert the glyph grid marks this sign, and no other, as the chosen one.
	@discardableResult
	func verifySignChosen(_ sign: String) -> Self {
		let chosen = app.buttons.matching(
			NSPredicate(format: "label == %@ AND isSelected == true", sign)
		).firstMatch
		XCTAssertTrue(chosen.waitUntilExists(timeout: 30), "\(sign) should be the chosen sign")
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
		XCTAssertTrue(bar.waitUntilExists(timeout: 10), "the reader should have a navigation bar")
		let settled = waitUntil("Waiting 10.0s for the glyph grid to reach the navigation bar", timeout: 10) {
			glyph.exists && abs(glyph.frame.minY - bar.frame.maxY) <= 1
		}
		XCTAssertTrue(
			settled,
			"the grid should sit just below the navigation bar at \(bar.frame.maxY), not at \(glyph.frame.minY)")
		return self
	}

	/// Tap a comic, artwork or feature page's framed picture and wait for the zoom viewer.
	@discardableResult
	func openImageViewer() -> Self {
		let image = app.element(matching: TestIdentifiers.News.storyImage)
		XCTAssertTrue(image.waitUntilExists(timeout: 30), "the story should draw its picture framed")
		XCTAssertTrue(image.waitForHittable(), "the picture should be ready to tap")
		image.tap()
		let close = closeButton
		XCTAssertTrue(close.waitUntilExists(timeout: 30), "tapping the picture should open the zoom viewer")
		return self
	}

	/// Open a story straight from its route, and wait for its headline.
	@discardableResult
	func navigate(to route: String) -> Self {
		open(route: route, mountedWhen: app.staticTexts[TestIdentifiers.News.storyHeadline])
	}

	/// Double-tap the middle of the picture in the zoom viewer.
	@discardableResult
	func doubleTapViewerImage() -> Self {
		let image = viewerImage
		XCTAssertTrue(image.waitUntilExists(timeout: 30), "the zoom viewer should show the picture")
		image.doubleTap()
		return self
	}

	/// How far a drag on the zoom viewer's picture goes, as a fraction of the window's height.
	enum ViewerDrag: Double {
		/// Well short of the distance that closes the viewer.
		case short = 0.08
		/// Well past the distance that closes the viewer.
		case long = 0.4
	}

	/// Drag the picture in the zoom viewer straight down from its middle, slowly, holding
	/// at the end so the release carries no speed: only the distance can close the viewer.
	@discardableResult
	func dragViewerImage(_ drag: ViewerDrag) -> Self {
		let image = viewerImage
		XCTAssertTrue(image.waitUntilExists(timeout: 30), "the zoom viewer should show the picture")
		let window = app.windows.firstMatch
		let start = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
		let end = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5 + drag.rawValue))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
		return self
	}

	/// Assert the zoom viewer is still up, or has gone and left the story.
	@discardableResult
	func verifyViewerOpen(_ open: Bool, _ message: String) -> Self {
		if open {
			// A dismissal takes a moment to animate, so Close is given time to go before this
			// counts the viewer as staying.
			XCTAssertFalse(closeButton.waitUntilGone(timeout: 3), message)
			XCTAssertTrue(closeButton.waitForHittable(), message)
		} else {
			XCTAssertTrue(closeButton.waitUntilGone(timeout: 30), message)
			XCTAssertTrue(
				app.staticTexts[TestIdentifiers.News.storyHeadline].waitUntilExists(timeout: 10),
				"closing the viewer should return to the story")
		}
		return self
	}

	/// Spread two fingers on the picture in the zoom viewer.
	@discardableResult
	func pinchOutViewerImage() -> Self {
		let image = viewerImage
		XCTAssertTrue(image.waitUntilExists(timeout: 30), "the zoom viewer should show the picture")
		image.pinch(withScale: 3, velocity: 1)
		return self
	}

	/// Assert the picture is drawn wider than the window, as a zoom in leaves it,
	/// or back to the window's width, as it opens at 1×.
	@discardableResult
	func verifyViewerImageZoomed(_ zoomed: Bool) -> Self {
		let image = viewerImage
		let window = app.windows.firstMatch.frame.width
		let settled = waitUntil("Waiting 10.0s for the picture to be \(zoomed ? "zoomed in" : "at fit")", timeout: 10) {
			let width = image.frame.width
			return zoomed ? width > window * 1.5 : abs(width - window) <= 1
		}
		XCTAssertTrue(
			settled,
			zoomed
				? "a double tap should zoom the picture in past the window's width of \(window), but it is \(image.frame.width) wide"
				: "a double tap when zoomed in should fit the picture back to the window's width of \(window), but it is \(image.frame.width) wide")
		return self
	}

	/// The headline of the story on top.
	/// Every story headline in the tree: one at rest, two mid-transition.
	private var headlineTexts: XCUIElementQuery {
		app.staticTexts.matching(identifier: TestIdentifiers.News.storyHeadline)
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
