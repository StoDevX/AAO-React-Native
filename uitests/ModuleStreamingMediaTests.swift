import XCTest

class ModuleStreamingMediaTests: UITestCaseUnbooted {
	/// The bar on Home opens the sheet on the last station viewed. Picking
	/// another station there only browses: the bar says what is loaded, not
	/// what the sheet shows. The sheet carries both stations, and the player's
	/// controls are buttons and links VoiceOver can name. Pausing leaves the
	/// station loaded, with Play to start it again. KSTO plays here, as KRLX's
	/// native stream needs a network the simulator's TLS does not always have.
	///
	/// Last, Streaming Media lists the streams under its tabs.
	func testTheBarOpensTheSheetOnBothStations() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.press(ids.playKsto, expecting: ids.pauseKsto)
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.checkButtons([ids.playKrlx] + ids.krlxActions)
			.checkLinks(ids.krlxLinks)
			.checkLogoIsNotAButton(ids.krlxLogoPrefix)
			.closeSheet(expectingBar: ids.pauseKsto)
			.press(ids.pauseKsto, expecting: ids.playKsto)
			.openFromHome()
			.checkStreamListExists()
			.checkTabs()
	}

	/// Turning Customize's Radio Player off takes the idle bar off Home, but
	/// Streaming Media keeps its own, so the radio is still a tap away.
	func testSwitchOffHidesOnlyHomesBar() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		app.launch()
		let screen = StreamingMediaScreen(app: app)
			.checkShows(ids.idleBar)
			.toggleShowRadioPlayer()
			.checkGone(ids.idleBar)
		keepStateForNextLaunch(adding: [])
		screen
			.navigate()
			.checkShows(ids.idleBar)
	}

	/// Each tap on the KSTO logo moves it to the next, and a drag across the
	/// record turns it, leaving the logo as it was. Whether the sheet also
	/// moves is UIKit's, and only a device shows it: a synthetic drag never
	/// closes this sheet over React Native content.
	func testTheLogoCyclesAndTheRecordCanBeScratched() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		let logos = ids.kstoLogos
		app.launch()
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.checkLogoCycles(logos)
			.tapLogo(labelled: ids.kstoLogoPrefix, until: logos[3])
			.checkScrubKeepsLogo(logos[3])
			.closeSheet(expectingBar: ids.idleBar)
	}
}
