import XCTest

/// Home's ⋯ menu → Contributing: the source code, feedback, OpenStreetMap, the
/// data sources and a way to email us.
struct ContributingScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.Contributing.screen) }

	@discardableResult
	func checkOpen() -> Self {
		XCTAssertTrue(host.waitForExistence(timeout: 10), "Contributing should open")
		return self
	}

	/// A row, found by the start of its label: a row with a detail line reads
	/// `title, detail`, and the host's identifier reaches every row in it. A
	/// row that opens a page outside the app is a link, and the rest are buttons.
	func row(_ title: String) -> XCUIElement {
		let types = [XCUIElement.ElementType.link, .button].map { Int($0.rawValue) }
		return host.descendants(matching: .any).matching(
			NSPredicate(
				format: "label BEGINSWITH %@ AND (elementType == %d OR elementType == %d)",
				title, types[0], types[1])
		).firstMatch
	}

	/// Scroll the screen until `title`'s row is on it: down the page first, then
	/// back up it for a row the page has already scrolled past.
	@discardableResult
	func reveal(_ title: String) -> Self {
		let target = row(title)
		for _ in 0..<8 {
			if target.exists && target.isHittable { break }
			host.swipeUp()
		}
		for _ in 0..<8 {
			if target.exists && target.isHittable { break }
			host.swipeDown()
		}
		XCTAssertTrue(target.exists, "Contributing should offer \(title)")
		return self
	}

	/// Tap Report a Problem and wait for its form. The tap is retried: the row
	/// is hittable as soon as the screen mounts, before its action reaches
	/// JavaScript, and a tap in between lands natively and does nothing.
	@discardableResult
	func openReportAProblem() -> Self {
		let target = row(TestIdentifiers.Contributing.reportProblem)
		XCTAssertTrue(target.waitForHittable(timeout: 10), "Contributing should offer Report a Problem")
		let form = app.navigationBars[TestIdentifiers.Support.reportProblemTitle]
		for _ in 0..<3 {
			target.tap()
			if form.waitForExistence(timeout: 10) { break }
		}
		XCTAssertTrue(form.exists, "Report a Problem should open its form")
		return self
	}
}
