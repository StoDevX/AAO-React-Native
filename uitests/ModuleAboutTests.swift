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

		about.reveal(about.version)
		about.reveal(about.text(ids.storyHeading))

		let first = about.text(ids.firstEra)
		let second = about.text(ids.secondEra)
		about.reveal(first)
		XCTAssertTrue(about.isOnScreen(first), "The timeline should open on its newest era")

		about.reveal(about.pageDots)
		XCTAssertEqual(about.pageDots.value as? String, ids.page(1), "The dots should mark the first era")

		about.swipeToNextCard(from: first, toShow: second)
		XCTAssertFalse(about.isOnScreen(first), "The newest era should scroll off to the side")
		XCTAssertTrue(
			about.pageDots.waitUntilSnapshot("to read \(ids.page(2))", timeout: 5) {
				$0.value as? String == ids.page(2)
			},
			"The dots should follow the swipe to the second era")

		let contributors = about.text(ids.contributors)
		let acknowledgements = about.text(ids.acknowledgements)
		about.reveal(contributors).reveal(acknowledgements)
		XCTAssertTrue(about.isOnScreen(contributors), "Contributors should sit within the screen")
		XCTAssertTrue(about.isOnScreen(acknowledgements), "Acknowledgements should sit within the screen")
		XCTAssertGreaterThan(
			acknowledgements.frame.minY, contributors.frame.maxY,
			"Acknowledgements should sit below Contributors")

		for page in [ids.privacy, ids.legal] {
			about.openPageAndComeBack(page)
		}
	}
}
