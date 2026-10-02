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
			streamList.waitForExistence(timeout: 30),
			"stream-list should be visible")
		return self
	}

	@discardableResult
	func checkTabs() -> Self {
		for tab in TestIdentifiers.StreamingMedia.tabs {
			XCTContext.runActivity(named: tab) { _ in
				let tabButton = app.tabButton(tab)
				XCTAssertTrue(
					tabButton.waitForExistence(timeout: 30),
					"\(tab) tab button should be visible")
			}
		}
		return self
	}

	/// Switch to a station's tab and wait for its buttons.
	///
	/// The tap is retried: a native tab switch can be dropped the same way a
	/// home-screen tile's can, and waiting longer on a dropped one achieves
	/// nothing.
	@discardableResult
	func openStation(_ tab: String, expecting label: String) -> Self {
		let tabButton = app.tabButton(tab)
		XCTAssertTrue(
			tabButton.waitForExistence(timeout: 30),
			"\(tab) tab button should be visible before switching to it")

		let marker = app.buttonLabelled(label)
		for attempt in 1...3 {
			tabButton.tap()
			if marker.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(named: "Tap \(attempt) on \(tab) showed no station; retrying") { _ in }
		}

		XCTFail("Switching to \(tab) never showed a button labelled \"\(label)\"")
		return self
	}

	/// Check each station button is a button VoiceOver can name, with a
	/// touch target of at least 44pt on each side.
	@discardableResult
	func checkStationButtons(_ labels: [String]) -> Self {
		for label in labels {
			XCTContext.runActivity(named: label) { _ in
				checkTouchTarget(app.buttonLabelled(label), named: "A button labelled \"\(label)\"")
			}
		}
		return self
	}

	/// Tap a station button, retrying a tap that never reached JavaScript,
	/// until `expecting` appears.
	@discardableResult
	func tapStationButton(_ label: String, expecting marker: String) -> Self {
		let button = app.buttonLabelled(label)
		XCTAssertTrue(button.waitForExistence(timeout: 30), "A button labelled \"\(label)\" should exist")
		let appeared = app.buttonLabelled(marker)
		for attempt in 1...3 {
			button.tap()
			if appeared.waitForExistence(timeout: 10) {
				return self
			}
			XCTContext.runActivity(named: "Tap \(attempt) on \(label) showed no \(marker); retrying") { _ in }
		}
		XCTFail("Tapping \"\(label)\" never showed a button labelled \"\(marker)\"")
		return self
	}

	/// Check the mini-player's stop button is on screen and big enough to tap.
	@discardableResult
	func checkMiniPlayer(stopLabelled label: String) -> Self {
		checkTouchTarget(app.buttonLabelled(label), named: "The mini-player's \"\(label)\" button")
		return self
	}

	/// Stop the station from the mini-player, and check the mini-player goes.
	@discardableResult
	func stopFromMiniPlayer(labelled label: String) -> Self {
		let stop = app.buttonLabelled(label)
		XCTAssertTrue(stop.waitForExistence(timeout: 10), "The mini-player should offer \"\(label)\"")
		stop.tap()
		let gone = XCTWaiter().wait(
			for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: stop)],
			timeout: 10)
		XCTAssertEqual(gone, .completed, "The mini-player should go once the station stops")
		return self
	}

	private func checkTouchTarget(_ element: XCUIElement, named name: String) {
		XCTAssertTrue(element.waitForExistence(timeout: 30), "\(name) should exist")
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
					logo.waitForExistence(timeout: 10),
					"Logo \(index + 1) should be a button labelled \"\(label)\"")
				capture(label)
				logo.tap()
			}
		}

		XCTAssertTrue(
			app.buttonLabelled(labels[0]).waitForExistence(timeout: 10),
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
		XCTAssertTrue(logo.waitForExistence(timeout: 10), "A logo labelled \"\(prefix)…\" should be a button")
		for _ in 0..<5 where !app.buttonLabelled(target).waitForExistence(timeout: 2) {
			logo.tap()
		}
		XCTAssertTrue(app.buttonLabelled(target).waitForExistence(timeout: 5), "Tapping the logo should reach \"\(target)\"")
		return self
	}

	/// Drag across the logo, well past a tap's slop, and check it is still
	/// the same logo: a scrub turns the record and must not count as a tap.
	@discardableResult
	func checkScrubKeepsLogo(_ label: String) -> Self {
		let logo = app.buttonLabelled(label)
		XCTAssertTrue(logo.waitForExistence(timeout: 10), "\"\(label)\" should be showing before the scrub")

		let start = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.25))
		let end = logo.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.2))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
		capture("\(label) after a scrub")

		XCTAssertTrue(
			app.buttonLabelled(label).waitForExistence(timeout: 5),
			"A scrub should leave the logo as \"\(label)\"")
		return self
	}
}
