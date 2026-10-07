import XCTest

class ModuleAboutTests: UITestCase {
	/// About, top to bottom: the version, the story's timeline of eras swiped
	/// sideways, the credits stacked one above the other, then Privacy and
	/// Legal each opening a screen of their own.
	///
	/// At the largest text sizes the header fills the first screen, so each
	/// part is scrolled to before it is checked, and only ever downwards.
	func testAboutFromTopToBottom() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		// LabeledContent reads its label and value as one element, so match its start.
		about.reveal(
			app.descendants(matching: .any)
				.matching(NSPredicate(format: "label BEGINSWITH %@", ids.version)).firstMatch)
		about.capture("about")
		about.reveal(about.text(ids.storyHeading))

		let first = about.text(ids.firstEra)
		let second = about.text(ids.secondEra)
		about.reveal(first)
		XCTAssertTrue(about.isOnScreen(first), "The timeline should open on its newest era")
		about.capture("about-timeline-first")

		about.reveal(about.pageDots)
		XCTAssertEqual(about.pageDots.value as? String, "1 of 3", "The dots should mark the first era")

		about.swipeToNextCard(from: first, toShow: second)
		XCTAssertFalse(about.isOnScreen(first), "The newest era should scroll off to the side")
		XCTAssertTrue(
			about.pageDots.waitUntilSnapshot("to read 2 of 3", timeout: 5) { $0.value as? String == "2 of 3" },
			"The dots should follow the swipe to the second era")
		about.capture("about-timeline-second")

		let contributors = about.text(ids.contributors)
		let acknowledgements = about.text(ids.acknowledgements)
		about.reveal(contributors).reveal(acknowledgements)
		XCTAssertTrue(about.isOnScreen(contributors), "Contributors should sit within the screen")
		XCTAssertTrue(about.isOnScreen(acknowledgements), "Acknowledgements should sit within the screen")
		XCTAssertGreaterThan(
			acknowledgements.frame.minY, contributors.frame.maxY,
			"Acknowledgements should sit below Contributors")
		about.capture("about-credits")

		for page in [ids.privacy, ids.legal] {
			about.reveal(about.row(page))
			about.row(page).tap()
			XCTAssertTrue(
				app.navigationBars[page].waitUntilExists(timeout: 30), "\(page) should open its own screen")
			about.capture("about-\(page.lowercased())").goBack()
			XCTAssertTrue(about.host.waitUntilExists(timeout: 10), "Back should return to About")
		}
	}
}
