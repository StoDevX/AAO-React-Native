import XCTest

class ModuleStreamingMediaTests: UITestCaseUnbooted {
	/// The Radio tab carries both stations: the picker moves between them,
	/// and the player's controls are buttons VoiceOver can name.
	func testRadioTabOffersBothStations() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.checkTabs()
			.openRadioTab(expecting: ids.kstoLogos[0])
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.capture("Radio tab, KRLX")
			.checkButtons([ids.playKrlx] + ids.krlxActions)
			.checkLogoIsNotAButton(ids.krlxLogoPrefix)
	}

	/// The bar on Home opens the sheet on the last station viewed. Picking
	/// another station there only browses: nothing plays until Play, and the
	/// bar says what is loaded, not what the sheet shows.
	func testTheBarOpensTheSheet() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.capture("Sheet, KRLX")
			.press(ids.playKrlx, expecting: ids.stopKrlx)
			.closeSheet(expectingBar: ids.stopKrlx)
			.capture("Home, KRLX loaded")
			.press(ids.stopKrlx, expecting: ids.idleBar)
	}

	/// With "Show Radio Player" off, neither bar shows until a station is
	/// started from the Radio tab. While it plays, the bar is back on the
	/// other tabs, and goes with the station when Stop is pressed there.
	func testSwitchOffHidesTheBars() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		let screen = StreamingMediaScreen(app: app)
			.toggleShowRadioPlayer()
			.checkGone(ids.idleBar)
			.capture("Home, radio player off")
		screen
			.openFromHome()
			.checkGone(ids.idleBar)
			.openRadioTab(expecting: ids.kstoLogos[0])
			.press(ids.playKsto, expecting: ids.stopKsto)
			// The Radio tab is the player, so the bar shows on the others.
			.openTab("Webcams", expectingButton: ids.stopKsto)
			.capture("Webcams, KSTO playing with the switch off")
			.tapButton(ids.stopKsto)
			.checkGone(ids.stopKsto)
	}

	func testKstoLogoCyclesOnTap() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.navigate()
			.openRadioTab(expecting: ids.kstoLogos[0])
			.checkLogoCycles(ids.kstoLogos)
	}

	func testKstoScratchKeepsTheLogo() throws {
		let logos = TestIdentifiers.StreamingMedia.kstoLogos
		StreamingMediaScreen(app: app)
			.navigate()
			.openRadioTab(expecting: logos[0])
			.tapLogo(labelled: TestIdentifiers.StreamingMedia.kstoLogoPrefix, until: logos[3])
			.checkScrubKeepsLogo(logos[3])
	}
}
