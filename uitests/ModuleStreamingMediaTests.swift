import XCTest

class ModuleStreamingMediaTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.checkTabs()
			.openStation(
				TestIdentifiers.StreamingMedia.krlxTab,
				expecting: TestIdentifiers.StreamingMedia.krlxButtons[0]
			)
			.checkStationButtons(TestIdentifiers.StreamingMedia.krlxButtons)
	}
}
