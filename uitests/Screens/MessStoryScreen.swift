import XCTest

struct MessStoryScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func verifyStoryAppears() -> Self {
		let headline = app.staticTexts[TestIdentifiers.News.storyHeadline]
		XCTAssertTrue(headline.waitForExistence(timeout: 30), "the story's headline should be visible")
		capture("Olaf Messenger story")
		XCTAssertTrue(
			app.buttons[TestIdentifiers.News.shareStory].waitForExistence(timeout: 10),
			"the reader should offer Share")
		// A story with no body text sends the reader to the website instead, so
		// either one proves the page below the header was drawn.
		let body = app.element(matching: TestIdentifiers.News.storyBody)
		let siteLink = app.element(matching: TestIdentifiers.News.storySiteLink)
		XCTAssertTrue(
			body.waitForExistence(timeout: 10) || siteLink.exists,
			"the story's body, or a link to read it on the web, should be below the header")
		return self
	}
}
