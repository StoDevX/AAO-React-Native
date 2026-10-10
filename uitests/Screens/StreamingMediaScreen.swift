import XCTest

struct StreamingMediaScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.element(matching: TestIdentifiers.Streaming.list)
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/streaming-media", mountedWhen: mounted)
	}

	/// Tap a button labelled `label`, and wait for one labelled `marker`.
	@discardableResult
	func press(_ label: String, expecting marker: String) -> Self {
		tap(app.buttonLabelled(label), until: app.buttonLabelled(marker), named: "\"\(label)\"")
		return self
	}

	/// Check each button is one VoiceOver can name, with a target of at least
	/// 44pt on each side.
	@discardableResult
	func checkButtons(_ labels: [String]) -> Self {
		for label in labels {
			XCTContext.runActivity(named: label) { _ in
				checkTouchTarget(app.buttonLabelled(label), named: "A button labelled \"\(label)\"")
			}
		}
		return self
	}

	/// Open the Now Playing sheet from the bar, and wait for `play` in it.
	@discardableResult
	func openSheetFromBar(expecting play: String) -> Self {
		tap(app.buttonLabelled(TestIdentifiers.StreamingMedia.idleBar),
			until: app.buttonLabelled(play), named: "the Now Playing bar")
		return self
	}

	/// Swipe the sheet away, and check the bar beneath shows `label`.
	@discardableResult
	func closeSheet(expectingBar label: String) -> Self {
		let airStatus = app.element(matching: TestIdentifiers.StreamingMedia.airStatus)
		XCTAssertTrue(airStatus.waitUntilExists(timeout: 10), "The sheet should be open before it is closed")
		// By the grabber, above the station picker: a drag that starts on the
		// picker or the record goes to them instead.
		let grabber = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.075))
		let bottom = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 1.0))
		grabber.press(forDuration: 0.05, thenDragTo: bottom, withVelocity: .fast, thenHoldForDuration: 0)
		checkGone(airStatus, named: "The sheet")
		checkTouchTarget(app.buttonLabelled(label), named: "The bar's \"\(label)\"")
		return self
	}

	/// Check something labelled `label` is on screen. A check that a thing has
	/// gone proves nothing unless it was there first.
	@discardableResult
	func checkShows(_ label: String) -> Self {
		XCTAssertTrue(
			app.elementWithLabel(startingWith: label).waitUntilExists(timeout: 10),
			"Something labelled \"\(label)\" should be showing")
		return self
	}

	/// Check nothing labelled `label` is on screen, waiting for it to go.
	@discardableResult
	func checkGone(_ label: String) -> Self {
		checkGone(app.elementWithLabel(startingWith: label), named: "Anything labelled \"\(label)\"")
	}

	/// Check `element` is not on screen, waiting for it to go.
	@discardableResult
	func checkGone(_ element: XCUIElement, named name: String) -> Self {
		XCTAssertTrue(element.waitUntilGone(timeout: 10), "\(name) should be gone")
		return self
	}

	/// Turn Customize's Radio Player switch, then close the sheet.
	@discardableResult
	func toggleShowRadioPlayer() -> Self {
		HomeScreen(app: app).openCustomize().toggleRadioPlayer().close()
		return self
	}

	private func checkTouchTarget(_ element: XCUIElement, named name: String) {
		XCTAssertTrue(element.waitUntilExists(timeout: 10), "\(name) should exist")
		XCTAssertGreaterThanOrEqual(element.frame.height, 44, "\(name) should be at least 44pt tall")
		XCTAssertGreaterThanOrEqual(element.frame.width, 44, "\(name) should be at least 44pt wide")
	}

	/// Drag across the logo, well past a tap's slop, and check it is still
	/// the same logo: a scrub turns the record and must not count as a tap.
	///
	/// Found by label whatever its type: a station with one logo has none to
	/// change to, so its record is an image rather than a button.
	@discardableResult
	func checkScrubKeepsLogo(_ label: String) -> Self {
		let logo = logoLabelled(label)
		XCTAssertTrue(logo.waitUntilExists(timeout: 10), "\"\(label)\" should be showing before the scrub")

		let start = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.25))
		let end = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.2))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)

		XCTAssertTrue(
			logoLabelled(label).waitUntilExists(timeout: 5),
			"A scrub should leave the logo as \"\(label)\"")
		return self
	}

	private func logoLabelled(_ label: String) -> XCUIElement {
		app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
	}
}
