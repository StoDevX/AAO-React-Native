import XCTest

class ModuleSomethingSecretTests: UITestCaseUnbooted {
	/// What each stage of the slab looks like, for a person to open and check: the edge breaking
	/// the ground, the risen slab with its inscription, the cracks, and the split with its button.
	/// The clock is frozen under UI tests, so a started slab never sinks while it is photographed.
	func testSlabStages() throws {
		let secret = SomethingSecretScreen(app: app)
		for (progress, name) in [(60, "edge"), (120, "risen"), (200, "cracking")] {
			secret.launch(at: progress).scrollToSlab().capture("Secret slab, \(name) (\(progress) taps)")
		}
		secret.launch(at: 250).scrollToButton().capture("Secret slab, open")
	}

	/// Pushing the red button melts the app down to the dead screen. The clock is frozen under UI
	/// tests, so the lockout holds for as long as the test looks.
	func testPushingTheButtonLocksTheApp() throws {
		SomethingSecretScreen(app: app)
			.launch(at: 250)
			.scrollToButton()
			.pushTheButton()
			.checkAppIsResting()
			.capture("The melt, over the dead screen")
	}

	/// A lockout that runs out pours the app back up with the slab's space gone. The cover and the
	/// rewind take about 3.5 seconds, so the dead screen is waited out before looking.
	func testWaitingOutTheLockoutReburiesTheSlab() throws {
		let secret = SomethingSecretScreen(app: app).launchWithLockoutEnded()
		let resting = app.staticTexts[TestIdentifiers.SomethingSecret.resting]
		XCTAssertTrue(resting.waitForNonExistence(timeout: 15), "The dead screen should go once the lockout ends")
		// The rewind's window holds the screen until it has poured the app back.
		sleep(4)
		secret.checkSlabIsBuried().capture("After the rewind, the slab buried")
	}
}
