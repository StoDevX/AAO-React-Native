import XCTest

/// Tags: campus:example.college
class ModuleStreamingMediaTests: UITestCase {
	/// The bar on Home opens the sheet on KMNK, Wiki Monkeys' one station. The
	/// player's controls are buttons VoiceOver can name. Pausing leaves the
	/// station loaded, with Play to start it again.
	func testTheBarOpensTheSheetOnTheStation() throws {
		let ids = TestIdentifiers.StreamingMedia.self
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: ids.playKmnk)
			.press(ids.playKmnk, expecting: ids.pauseKmnk)
			// Playing now, so the button reads Pause.
			.checkButtons([ids.pauseKmnk] + ids.kmnkActions)
			.closeSheet(expectingBar: ids.pauseKmnk)
			.press(ids.pauseKmnk, expecting: ids.playKmnk)
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
			.openSheetFromBar(expecting: ids.playKmnk)
			.checkScrubKeepsLogo(ids.kmnkLogo)
			.closeSheet(expectingBar: ids.idleBar)
	}
}
