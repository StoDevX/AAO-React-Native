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
		return self
	}
}
