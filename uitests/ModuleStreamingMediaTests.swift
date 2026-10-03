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
			.checkLinks(ids.krlxLinks)
			.checkAboveTabBar(ids.krlxActions + ids.krlxLinks)
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
			.checkShows(ids.idleBar)
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

	/// Turning "Show Radio Player" off while a station plays stops it and
	/// takes the bar away; turning it on again brings back the idle bar.
	func testSwitchOffStopsThePlayingStation() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.press(ids.playKsto, expecting: ids.stopKsto)
			.closeSheet(expectingBar: ids.stopKsto)
			.toggleShowRadioPlayer()
			.checkGone(ids.stopKsto)
			.checkGone(ids.idleBar)
			.capture("Home, switch turned off while KSTO played")
			.toggleShowRadioPlayer()
			.checkShows(ids.idleBar)
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
