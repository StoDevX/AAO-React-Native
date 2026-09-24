import XCTest

struct StreamingMediaScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.streamingMedia)
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

	/// Check the station's website control reads as a link, since it leaves
	/// the app, with a touch target of at least 44pt on each side.
	@discardableResult
	func checkStationLink(_ label: String) -> Self {
		checkTouchTarget(app.linkLabelled(label), named: "A link labelled \"\(label)\"")
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
}
