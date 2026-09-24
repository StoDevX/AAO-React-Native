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
				let button = app.buttonLabelled(label)
				XCTAssertTrue(
					button.waitForExistence(timeout: 30),
					"A button labelled \"\(label)\" should exist")
				XCTAssertGreaterThanOrEqual(
					button.frame.height, 44, "\"\(label)\" should be at least 44pt tall")
				XCTAssertGreaterThanOrEqual(
					button.frame.width, 44, "\"\(label)\" should be at least 44pt wide")
			}
		}
		return self
	}
}
