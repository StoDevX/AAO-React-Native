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
			.checkStationLink(TestIdentifiers.StreamingMedia.krlxWebsiteLink)
			.checkLogoIsNotAButton(TestIdentifiers.StreamingMedia.krlxLogoPrefix)
	}

	func testKstoLogoCyclesOnTap() throws {
		StreamingMediaScreen(app: app)
			.navigate()
			.openStation(
				TestIdentifiers.StreamingMedia.kstoTab,
				expecting: TestIdentifiers.StreamingMedia.kstoLogos[0]
			)
			.checkLogoCycles(TestIdentifiers.StreamingMedia.kstoLogos)
	}
}
