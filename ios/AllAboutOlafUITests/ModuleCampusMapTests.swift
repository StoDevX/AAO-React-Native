import XCTest

class ModuleCampusMapTests: UITestCase {
	/// Skipped: fails roughly nine CI runs in ten. It never reaches
	/// `dismissSafari()` — the failure is the third assertion of
	/// `navigateFromHome` (`Screen.swift:26`), where the home screen does not
	/// leave the accessibility hierarchy within 30s of the Campus Map button
	/// being tapped. `SFSafariViewController` presents *over* the app rather
	/// than replacing it, so `waitForNonExistence` may be the wrong assertion
	/// for this navigation rather than merely a slow one. Tracked by #7611.
	///
	/// `XCTSkipIf` rather than an early `throw` so the body below still compiles
	/// and stays honest about what we intend to re-enable.
	func testIsReachableFromHomescreen() throws {
		try XCTSkipIf(true, "Flaky: home screen never leaves the hierarchy. See #7611.")

		CampusMapScreen(app: app)
			.navigate()
			.dismissSafari()
			.checkReturnedToHomescreen()
	}
}
