import XCTest

class ModuleAboutTests: UITestCase {
	func testAboutOffersEverySection() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		// At the largest text sizes the header fills the first screen, so each
		// section is scrolled to before it is checked.
		// LabeledContent reads its label and value as one element, so match its start.
		about.reveal(
			app.descendants(matching: .any)
				.matching(NSPredicate(format: "label BEGINSWITH %@", ids.version)).firstMatch)
		about.capture("about")
		about.reveal(about.text(ids.storyHeading))

		about.reveal(about.row(ids.privacy))
		XCTAssertTrue(about.row(ids.legal).exists, "About should offer Legal")
		about.capture("about-bottom")
	}

	func testTimelineScrollsSideways() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		let first = about.text(ids.firstEra)
		let second = about.text(ids.secondEra)
		about.reveal(first)
		XCTAssertTrue(about.isOnScreen(first), "The timeline should open on its newest era")
		about.capture("about-timeline-first")

		about.reveal(about.pageDots)
		XCTAssertEqual(about.pageDots.value as? String, "1 of 3", "The dots should mark the first era")

		about.swipeToNextCard(from: first, toShow: second)
		XCTAssertFalse(about.isOnScreen(first), "The newest era should scroll off to the side")
		let onSecond = XCTNSPredicateExpectation(
			predicate: NSPredicate(format: "value == %@", "2 of 3"), object: about.pageDots)
		XCTAssertEqual(
			XCTWaiter().wait(for: [onSecond], timeout: 5), .completed,
			"The dots should follow the swipe to the second era")
		about.capture("about-timeline-second")
	}

	func testCreditsStackTheirRows() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		let contributors = about.text(ids.contributors)
		let acknowledgements = about.text(ids.acknowledgements)
		about.reveal(contributors).reveal(acknowledgements)
		XCTAssertTrue(about.isOnScreen(contributors), "Contributors should sit within the screen")
		XCTAssertTrue(about.isOnScreen(acknowledgements), "Acknowledgements should sit within the screen")
		XCTAssertGreaterThan(
			acknowledgements.frame.minY, contributors.frame.maxY,
			"Acknowledgements should sit below Contributors")
		about.capture("about-credits")
	}

	func testAboutOpensPrivacyAndLegal() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		for page in [ids.privacy, ids.legal] {
			about.reveal(about.row(page))
			about.row(page).tap()
			XCTAssertTrue(
				app.navigationBars[page].waitForExistence(timeout: 30), "\(page) should open its own screen")
			about.capture("about-\(page.lowercased())").goBack()
			XCTAssertTrue(about.host.waitForExistence(timeout: 10), "Back should return to About")
		}
	}
}
