import XCTest

/// About: the version, the app's story as cards that scroll
/// sideways, its credits, and the Privacy and Legal pages.
struct AboutScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.About.screen) }

	/// Open About by its route.
	@discardableResult
	func navigate() -> Self {
		open(route: "/about", mountedWhen: host)
	}

	/// A text in the screen, found by its label: the host's identifier reaches
	/// every element in it.
	func text(_ label: String) -> XCUIElement {
		host.staticTexts[label].firstMatch
	}

	/// The dots under the story, which say which era it shows, as a page
	/// control does.
	var pageDots: XCUIElement {
		app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@", TestIdentifiers.About.pageDots)).firstMatch
	}

	/// The version row. LabeledContent reads its label and value as one
	/// element, so it is matched by its start.
	var version: XCUIElement {
		app.descendants(matching: .any)
			.matching(NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.About.version)).firstMatch
	}

	/// Open `page`'s row, check it opens a screen of its own, and come back.
	@discardableResult
	func openPageAndComeBack(_ page: String) -> Self {
		let row = host.buttons[page].firstMatch
		reveal(row)
		tap(row, until: app.navigationBars[page], named: "About's \(page) row")
		goBack()
		XCTAssertTrue(host.waitUntilExists(timeout: 10), "Back should return to About")
		return self
	}

	/// Scroll the screen until `element` is on it.
	@discardableResult
	func reveal(_ element: XCUIElement) -> Self {
		// The screen draws a moment after it opens; swiping before then scrolls
		// past rows that are about to appear. Wait for the screen's first text,
		// not for `element`: a row further down is built only once it is
		// scrolled to, so waiting for it spends the whole timeout.
		if !element.exists {
			_ = host.staticTexts.firstMatch.waitUntilExists(timeout: 10)
		}
		// Enough swipes for the whole page at the largest text sizes.
		for _ in 0..<20 {
			if element.exists && element.isHittable { break }
			host.swipeUp()
		}
		XCTAssertTrue(element.exists, "About should offer what was asked for: \(element)")
		return self
	}

	/// Whether `element` sits within the screen's width, which a card that
	/// has scrolled off to the side does not.
	func isOnScreen(_ element: XCUIElement) -> Bool {
		let screen = app.windows.firstMatch.frame
		return element.exists && element.frame.minX >= 0 && element.frame.maxX <= screen.maxX
	}

	/// Swipe from the right to the left across `card`, to bring the next one in.
	@discardableResult
	func swipeToNextCard(from card: XCUIElement, toShow next: XCUIElement) -> Self {
		let start = card.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5))
		let end = card.coordinate(withNormalizedOffset: CGVector(dx: -0.2, dy: 0.5))
		start.press(forDuration: 0.1, thenDragTo: end)
		XCTAssertTrue(
			waitUntil("Waiting 10.0s for \(next) to come on screen", timeout: 10) { isOnScreen(next) },
			"Swiping should bring \(next.label) onto the screen")
		return self
	}
}
