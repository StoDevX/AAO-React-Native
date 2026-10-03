import XCTest

/// Home's ⋯ menu → About: the version, the app's story and its credits as
/// cards that scroll sideways, and the Privacy and Legal pages.
struct AboutScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.About.screen) }

	@discardableResult
	func checkOpen() -> Self {
		XCTAssertTrue(host.waitForExistence(timeout: 10), "About should open")
		return self
	}

	/// A text in the screen, found by its label: the host's identifier reaches
	/// every element in it.
	func text(_ label: String) -> XCUIElement {
		host.staticTexts[label].firstMatch
	}

	/// A row, found by its label.
	func row(_ title: String) -> XCUIElement {
		host.buttons[title].firstMatch
	}

	/// Scroll the screen until `element` is on it.
	@discardableResult
	func reveal(_ element: XCUIElement) -> Self {
		for _ in 0..<8 {
			if element.exists && element.isHittable { break }
			host.swipeUp()
		}
		XCTAssertTrue(element.exists, "About should offer \(element.label)")
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
		let arrived = XCTNSPredicateExpectation(
			predicate: NSPredicate { _, _ in isOnScreen(next) }, object: nil)
		XCTAssertEqual(
			XCTWaiter().wait(for: [arrived], timeout: 10), .completed,
			"Swiping should bring \(next.label) onto the screen")
		return self
	}
}
