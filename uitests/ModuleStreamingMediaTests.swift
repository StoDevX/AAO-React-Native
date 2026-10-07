import XCTest

class ModuleStreamingMediaTests: UITestCase {
	/// The bar on Home opens the sheet on the last station viewed. Picking
	/// another station there only browses: the bar says what is loaded, not
	/// what the sheet shows. The sheet carries both stations, and the player's
	/// controls are buttons and links VoiceOver can name. Pausing leaves the
	/// station loaded, with Play to start it again. KSTO plays here, as KRLX's
	/// native stream needs a network the simulator's TLS does not always have.
	func testTheBarOpensTheSheetOnBothStations() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.press(ids.playKsto, expecting: ids.pauseKsto)
			.pick(ids.krlxSegment, expecting: ids.playKrlx)
			.checkButtons([ids.playKrlx] + ids.krlxActions)
			.checkLinks(ids.krlxLinks)
			.checkLogoIsNotAButton(ids.krlxLogoPrefix)
			.closeSheet(expectingBar: ids.pauseKsto)
			.press(ids.pauseKsto, expecting: ids.playKsto)
	}

	/// Turning Customize's Radio Player off takes the idle bar off Home, but
	/// Streaming Media keeps its own, so the radio is still a tap away.
	func testSwitchOffHidesOnlyHomesBar() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		let screen = StreamingMediaScreen(app: app)
			.checkShows(ids.idleBar)
			.toggleShowRadioPlayer()
			.checkGone(ids.idleBar)
		keepStateForNextLaunch(adding: [])
		screen
			.navigate()
			.checkShows(ids.idleBar)
	}

	/// A drag across the record turns it, leaving the logo as it was: the
	/// scrub must not count as a tap on the logo. Whether the sheet also
	/// moves is UIKit's, and only a device shows it: a synthetic drag never
	/// closes this sheet over React Native content.
	func testTheRecordCanBeScratchedWithoutChangingTheLogo() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKsto)
			.checkScrubKeepsLogo(ids.kstoFirstLogo)
			.closeSheet(expectingBar: ids.idleBar)
	}
}
