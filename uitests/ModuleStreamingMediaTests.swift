import XCTest

class ModuleStreamingMediaTests: UITestCaseUnbooted {
	/// The sheet carries both stations: the picker moves between them, and the
	/// player's controls are buttons and links VoiceOver can name.
	func testTheSheetOffersBothStations() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.checkTabs()
			.openSheetFromBar(expecting: ids.playKsto)
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.capture("Sheet from Streaming Media, KRLX")
			.checkButtons([ids.playKrlx] + ids.krlxActions)
			.checkLinks(ids.krlxLinks)
			.checkLogoIsNotAButton(ids.krlxLogoPrefix)
	}

	/// The info button beside the picker credits both stations, each a link to
	/// its site. The test stops at the menu: a credit leaves the app.
	func testTheSheetCreditsBothStations() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.openSheetFromBar(expecting: ids.playKsto)
			.openCreditsMenu(ids.creditsMenu, listing: ids.credits)
			.capture("Sheet with the stations' credits menu open")
	}

	/// The bar on Home opens the sheet on the last station viewed. Picking
	/// another station there only browses: the bar says what is loaded, not
	/// what the sheet shows. Pausing leaves the station loaded, with Play to
	/// start it again. KSTO plays here, as KRLX's native stream needs a
	/// network the simulator's TLS does not always have.
	func testTheBarOpensTheSheet() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.press(ids.playKsto, expecting: ids.pauseKsto)
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.capture("Sheet, KRLX, with KSTO playing")
			.closeSheet(expectingBar: ids.pauseKsto)
			.capture("Home, KSTO loaded")
			.press(ids.pauseKsto, expecting: ids.playKsto)
	}

	/// "Show Radio Player on Home" off takes the idle bar off Home, but
	/// Streaming Media keeps its own, so the radio is still a tap away.
	func testSwitchOffHidesOnlyHomesBar() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.checkShows(ids.idleBar)
			.toggleShowRadioPlayer()
			.checkGone(ids.idleBar)
			.capture("Home, radio player off")
			.openFromHome()
			.checkShows(ids.idleBar)
			.openSheetFromBar(expecting: ids.playKsto)
	}

	/// Turning the switch off while a station plays stops it and takes the bar
	/// away; turning it on again brings back the idle bar.
	func testSwitchOffStopsThePlayingStation() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.press(ids.playKsto, expecting: ids.pauseKsto)
			.closeSheet(expectingBar: ids.pauseKsto)
			.toggleShowRadioPlayer()
			.checkGone(ids.pauseKsto)
			.checkGone(ids.idleBar)
			.capture("Home, switch turned off while KSTO played")
			.toggleShowRadioPlayer()
			.checkShows(ids.idleBar)
	}

	func testKstoLogoCyclesOnTap() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.checkLogoCycles(ids.kstoLogos)
	}

	/// A drag across the record turns it, leaving the logo as it was. Whether
	/// the sheet also moves is UIKit's, and only a device shows it: a
	/// synthetic drag never closes this sheet over React Native content.
	func testTheRecordCanBeScratched() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		let logos = ids.kstoLogos
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.tapLogo(labelled: ids.kstoLogoPrefix, until: logos[3])
			.checkScrubKeepsLogo(logos[3])
			.closeSheet(expectingBar: ids.idleBar)
	}
}
