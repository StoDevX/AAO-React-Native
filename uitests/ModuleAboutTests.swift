import XCTest

class ModuleAboutTests: UITestCase {
	func testAboutOffersEverySection() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		XCTAssertTrue(about.text(ids.version).waitForExistence(timeout: 10), "About should show the version")
		XCTAssertTrue(about.text(ids.storyHeading).exists, "About should have an Our story section")
		about.capture("about")

		about.reveal(about.row(ids.privacy))
		XCTAssertTrue(about.row(ids.legal).exists, "About should offer Legal")
		about.capture("about-bottom")
	}

	func testTimelineScrollsSideways() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		let first = about.text(ids.firstEra)
		let second = about.text(ids.secondEra)
		XCTAssertTrue(first.waitForExistence(timeout: 10), "The timeline should open on its newest era")
		XCTAssertTrue(about.isOnScreen(first), "The newest era should be on screen")
		about.capture("about-timeline-first")

		about.swipeToNextCard(from: first, toShow: second)
		XCTAssertFalse(about.isOnScreen(first), "The newest era should scroll off to the side")
		about.capture("about-timeline-second")
	}

	func testCreditsPageToAcknowledgements() throws {
		let about = HomeScreen(app: app).checkHomescreenExists().openAbout()
		let ids = TestIdentifiers.About.self

		let contributors = about.text(ids.contributors)
		let acknowledgements = about.text(ids.acknowledgements)
		about.reveal(contributors)
		XCTAssertTrue(about.isOnScreen(contributors), "Credits should open on the contributors")
		about.capture("about-credits-first")

		about.swipeToNextCard(from: contributors, toShow: acknowledgements)
		about.capture("about-credits-second")
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
