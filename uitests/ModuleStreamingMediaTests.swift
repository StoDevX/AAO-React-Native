import XCTest

class ModuleStreamingMediaTests: UITestCase {
	func testStreamsAndAStationAreReachableFromHomescreen() throws {
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.returnHome()
			.openStation(
				TestIdentifiers.Buttons.krlx,
				expecting: TestIdentifiers.StreamingMedia.krlxButtons[0]
			)
			.checkStationButtons(TestIdentifiers.StreamingMedia.krlxButtons)
			.checkLogoIsNotAButton(TestIdentifiers.StreamingMedia.krlxLogoPrefix)
	}

	func testKstoLogoCyclesOnTap() throws {
		StreamingMediaScreen(app: app)
			.openStation(
				TestIdentifiers.Buttons.ksto,
				expecting: TestIdentifiers.StreamingMedia.kstoLogos[0]
			)
			.checkLogoCycles(TestIdentifiers.StreamingMedia.kstoLogos)
	}

	func testKstoScratchKeepsTheLogo() throws {
		let logos = TestIdentifiers.StreamingMedia.kstoLogos
		StreamingMediaScreen(app: app)
			.openStation(TestIdentifiers.Buttons.ksto, expecting: logos[0])
			.tapLogo(labelled: TestIdentifiers.StreamingMedia.kstoLogoPrefix, until: logos[3])
			.checkScrubKeepsLogo(logos[3])
	}
}
