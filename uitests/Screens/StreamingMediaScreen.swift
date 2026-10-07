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

	@discardableResult
	func checkStreamListExists() -> Self {
		let streamList = app.element(matching: TestIdentifiers.Streaming.list)
		XCTAssertTrue(
			streamList.waitUntilExists(timeout: 30),
			"stream-list should be visible")
		return self
	}

	@discardableResult
	func checkTabs() -> Self {
		for tab in TestIdentifiers.StreamingMedia.tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabButton = app.tabButton(tab)
				XCTAssertTrue(
					tabButton.waitUntilExists(timeout: 30),
					"\(tab) tab button should be visible")
			}
		}
		return self
	}

	/// Tap `element` until `marker` appears, up to three times.
	///
	/// A native tab switch or a first tap after launch can be dropped, and
	/// waiting longer on a dropped one achieves nothing. Each attempt looks the
	/// element up again and stops if it has gone: a tap that did land may have
	/// changed it.
	private func tap(_ element: XCUIElement, until marker: XCUIElement, named name: String) {
		XCTAssertTrue(element.waitUntilExists(timeout: 30), "\(name) should exist before it is tapped")
		for attempt in 1...3 {
			if element.exists {
				element.tap()
			}
			if marker.waitUntilExists(timeout: 10) {
				return
			}
			XCTContext.runActivity(named: "Tap \(attempt) on \(name) changed nothing; retrying") { _ in }
		}
		XCTFail("Tapping \(name) never brought up what it should")
	}

	/// Open Streaming Media from its Home tile rather than by URL. Opening a URL
	/// relaunches the app, which resets state a test has just set up.
	@discardableResult
	func openFromHome() -> Self {
		tap(app.buttons["Streaming Media"], until: mounted, named: "the Streaming Media tile")
		return self
	}



	/// Pick a station in the player's segmented control, and wait for its Play.
	@discardableResult
	func pick(_ segment: String, expecting play: String) -> Self {
		tap(app.buttons[segment], until: app.buttonLabelled(play), named: "the \(segment) segment")
		return self
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

	/// Check each control that leaves the app is a link VoiceOver can name,
	/// with a target of at least 44pt on each side.
	@discardableResult
	func checkLinks(_ labels: [String]) -> Self {
		for label in labels {
			XCTContext.runActivity(named: label) { _ in
				checkTouchTarget(app.linkLabelled(label), named: "A link labelled \"\(label)\"")
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

	/// Tap the button labelled `label`, once it shows.
	@discardableResult
	func tapButton(_ label: String) -> Self {
		let button = app.buttonLabelled(label)
		XCTAssertTrue(button.waitUntilExists(timeout: 10), "A button labelled \"\(label)\" should exist")
		button.tap()
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
		XCTAssertTrue(element.waitUntilExists(timeout: 30), "\(name) should exist")
		XCTAssertGreaterThanOrEqual(element.frame.height, 44, "\(name) should be at least 44pt tall")
		XCTAssertGreaterThanOrEqual(element.frame.width, 44, "\(name) should be at least 44pt wide")
	}

	/// Tap the logo through every one of `labels`, capturing each, and check
	/// the tap after the last one comes back to the first.
	@discardableResult
	func checkLogoCycles(_ labels: [String]) -> Self {
		for (index, label) in labels.enumerated() {
			XCTContext.runActivity(named: label) { _ in
				let logo = app.buttonLabelled(label)
				XCTAssertTrue(
					logo.waitUntilExists(timeout: 10),
					"Logo \(index + 1) should be a button labelled \"\(label)\"")
				capture(label)
				logo.tap()
			}
		}

		XCTAssertTrue(
			app.buttonLabelled(labels[0]).waitUntilExists(timeout: 10),
			"Tapping the last logo should come back to \"\(labels[0])\"")
		return self
	}

	/// Check a station with one logo leaves it as a picture, not a button.
	@discardableResult
	func checkLogoIsNotAButton(_ labelPrefix: String) -> Self {
		let logoButtons = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", labelPrefix))
		XCTAssertEqual(logoButtons.count, 0, "No button should be labelled \"\(labelPrefix)…\"")
		return self
	}

	/// Tap the logo whose label begins `prefix` until it reads `target`.
	@discardableResult
	func tapLogo(labelled prefix: String, until target: String) -> Self {
		let logo = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
		XCTAssertTrue(logo.waitUntilExists(timeout: 10), "A logo labelled \"\(prefix)…\" should be a button")
		for _ in 0..<5 {
			if app.buttonLabelled(target).waitUntilExists(timeout: 2) {
				break
			}
			logo.tap()
		}
		XCTAssertTrue(app.buttonLabelled(target).waitUntilExists(timeout: 5), "Tapping the logo should reach \"\(target)\"")
		return self
	}

	/// Drag across the logo, well past a tap's slop, and check it is still
	/// the same logo: a scrub turns the record and must not count as a tap.
	@discardableResult
	func checkScrubKeepsLogo(_ label: String) -> Self {
		let logo = app.buttonLabelled(label)
		XCTAssertTrue(logo.waitUntilExists(timeout: 10), "\"\(label)\" should be showing before the scrub")

		let start = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.25))
		let end = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.2))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
		capture("\(label) after a scrub")

		XCTAssertTrue(
			app.buttonLabelled(label).waitUntilExists(timeout: 5),
			"A scrub should leave the logo as \"\(label)\"")
		return self
	}
}
