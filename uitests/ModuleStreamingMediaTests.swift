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

	func testKstoScratchKeepsTheLogo() throws {
		let logos = TestIdentifiers.StreamingMedia.kstoLogos
		StreamingMediaScreen(app: app)
			.navigate()
			.openStation(TestIdentifiers.StreamingMedia.kstoTab, expecting: logos[0])
			.tapLogo(labelled: TestIdentifiers.StreamingMedia.kstoLogoPrefix, until: logos[3])
			.checkScrubKeepsLogo(logos[3])
	}
}
