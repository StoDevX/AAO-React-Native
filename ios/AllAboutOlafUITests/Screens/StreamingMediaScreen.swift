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
		assertExists(streamList, "stream-list should be visible")
		return self
	}

	@discardableResult
	func checkTabs() -> Self {
		checkTabButtons(TestIdentifiers.StreamingMedia.tabs)
	}
}
