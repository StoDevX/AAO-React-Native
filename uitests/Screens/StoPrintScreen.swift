import XCTest

struct StoPrintScreen: Screen {
	let app: XCUIApplication

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars[TestIdentifiers.StoPrint.title]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/print-jobs", mountedWhen: mounted)
	}

	/// The mocked jobs are listed, not the spinner that precedes them: a
	/// section header from the fixtures is up.
	@discardableResult
	func verifyJobsListed() -> Self {
		XCTAssertTrue(
			app.staticTexts[TestIdentifiers.StoPrint.pendingRelease].firstMatch.waitUntilExists(timeout: 30),
			"Print Jobs should list the mocked jobs")
		return self
	}

	/// Open the job whose row starts with `name`, and wait for an element
	/// whose label starts with `marker` on the screen it opens.
	@discardableResult
	func openJob(_ name: String, until marker: String) -> Self {
		tap(startingWith(name), until: startingWith(marker), named: "\(name)'s row")
	}

	/// Choose the first printer, and check the release screen offers Print.
	/// Every printer in the fixtures is named mfc-<something>, and their
	/// location is blank, so a row is its name alone.
	@discardableResult
	func choosePrinter() -> Self {
		tap(
			startingWith(TestIdentifiers.StoPrint.printerPrefix),
			until: app.buttons[TestIdentifiers.StoPrint.print].firstMatch, named: "the first printer")
	}

	private func startingWith(_ label: String) -> XCUIElement {
		app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
	}
}
