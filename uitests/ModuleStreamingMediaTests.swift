import XCTest

class ModuleStreamingMediaTests: UITestCaseUnbooted {
	func testKrlxOffersItsStationButtons() throws {
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

	/// A station keeps playing after its screen closes, and the mini-player
	/// over the rest of the app can stop it. Whether the stream itself arrives
	/// does not matter here: the mini-player shows from the tap on Listen.
	func testStationPlaysOnFromTheMiniPlayer() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.navigate()
			.openStation(ids.krlxTab, expecting: ids.krlxButtons[0])
			.tapStationButton(ids.krlxButtons[0], expecting: ids.krlxMiniPlayerStop)
			.checkMiniPlayer(stopLabelled: ids.krlxMiniPlayerStop)
			.capture("KRLX loaded, mini-player in the tab bar")
			.goBack()
			.checkMiniPlayer(stopLabelled: ids.krlxMiniPlayerStop)
			.capture("KRLX loaded, mini-player floating over Home")
			.stopFromMiniPlayer(labelled: ids.krlxMiniPlayerStop)
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
