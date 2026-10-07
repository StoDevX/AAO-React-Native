import XCTest

/// Home's ⋯ menu → Support: FAQs, Notices, emergency contacts, feedback, and
/// the telemetry switch.
struct SupportScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.Support.screen) }

	@discardableResult
	func checkOpen() -> Self {
		XCTAssertTrue(host.waitUntilExists(timeout: 10), "Support should open")
		return self
	}

	/// A row, found by its label: the host's identifier reaches every row in it.
	func row(_ title: String) -> XCUIElement {
		host.buttons[title].firstMatch
	}

	@discardableResult
	func checkOffersEveryRow() -> Self {
		let support = TestIdentifiers.Support.self
		for title in [support.faqs, support.sendFeedback] {
			XCTAssertTrue(row(title).waitUntilExists(timeout: 10), "Support should offer \(title)")
		}
		let toggle = host.switches[support.telemetryToggle].firstMatch
		XCTAssertTrue(toggle.waitUntilExists(timeout: 10), "Support should offer the telemetry switch")
		return self
	}

	/// Tap `title` and wait for `mounted`, the screen it opens.
	@discardableResult
	func open(_ title: String, mountedWhen mounted: XCUIElement) -> Self {
		let target = row(title)
		XCTAssertTrue(target.waitUntilExists(timeout: 10), "Support should offer \(title)")
		target.tap()
		XCTAssertTrue(mounted.waitUntilExists(timeout: 30), "\(title) should open its own screen")
		return self
	}
}
