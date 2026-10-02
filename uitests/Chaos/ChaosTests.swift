import XCTest

extension UITestCaseUnbooted {
	/// Sets the next launch's arguments for a chaos run: no `--uitesting`, so
	/// features fetch live rather than from their fixtures.
	func configureForChaos(seed: UInt64, launch: Int, replay: Bool, faultRate: String, resetState: Bool) {
		var arguments = [
			TestIdentifiers.Chaos.flag,
			TestIdentifiers.Chaos.seed, String(seed),
			TestIdentifiers.Chaos.launch, String(launch),
			TestIdentifiers.Chaos.faultRate, faultRate,
		]
		if replay { arguments.append(TestIdentifiers.Chaos.replay) }
		if resetState { arguments.append(TestIdentifiers.LaunchArguments.resetState) }
		app.launchArguments = arguments
		appendJsLocationIfProvided()
	}
}

/// A chaos run: `mise run chaos` sets the seed and budget. Skipped anywhere
/// else, including the CI shards, which discover every test class.
final class ChaosTests: UITestCaseUnbooted {
	func testChaos() throws {
		let env = ProcessInfo.processInfo.environment
		guard let seed = env["AAO_CHAOS_SEED"].flatMap(UInt64.init) else {
			throw XCTSkip("a chaos run needs AAO_CHAOS_SEED; start one with mise run chaos")
		}
		let monkey = ChaosMonkey(
			test: self,
			seed: seed,
			replay: env["AAO_CHAOS_REPLAY"] == "1",
			faultRate: env["AAO_CHAOS_FAULT_RATE"] ?? "0.25")
		monkey.run(
			steps: env["AAO_CHAOS_STEPS"].flatMap(Int.init) ?? 500,
			duration: env["AAO_CHAOS_DURATION"].flatMap(TimeInterval.init) ?? 600)
	}
}

/// Proves the chaos oracles can see: if either fails, a chaos run would pass
/// while blind.
final class ChaosCanaryTests: UITestCaseUnbooted {
	func testFindsAJsFatal() {
		configureForChaos(seed: 1, launch: 0, replay: false, faultRate: "0", resetState: true)
		app.open(URL(string: "AllAboutOlaf://\(TestIdentifiers.Chaos.crashRoute)")!)
		let verdict = ChaosOracle(app: app).waitForStop(timeout: 30)
		XCTAssertTrue(
			verdict?.contains("chaos canary") == true,
			"the canary's render error should stop the run, got \(String(describing: verdict))")
	}

	func testABlindProbeIsReported() {
		// Launched without --chaos: no probe, no beacon.
		app.launchArguments = [TestIdentifiers.LaunchArguments.resetState]
		appendJsLocationIfProvided()
		app.launch()
		XCTAssertTrue(
			app.descendants(matching: .any)[TestIdentifiers.Home.screen].waitForExistence(timeout: 30),
			"Home should have mounted, so the beacon has had its chance to appear")
		let silence = ChaosOracle(app: app).waitForProbe(timeout: 5)
		XCTAssertEqual(silence?.reason, "probe silent: no \(TestIdentifiers.Chaos.beacon) element")
	}

	func testEscapesASheetInPortrait() {
		assertEscapesTheSheetTrap(in: .portrait)
	}

	/// An iPhone form sheet fills the screen in landscape and draws no
	/// grabber, so the monkey has to rotate before it can leave.
	func testEscapesASheetInLandscape() {
		assertEscapesTheSheetTrap(in: .landscapeLeft)
	}

	private func assertEscapesTheSheetTrap(in orientation: UIDeviceOrientation) {
		addTeardownBlock { XCUIDevice.shared.orientation = .portrait }
		configureForChaos(seed: 1, launch: 0, replay: false, faultRate: "0", resetState: true)
		app.open(URL(string: "AllAboutOlaf://\(TestIdentifiers.Chaos.sheetTrapRoute)")!)
		let trap = app.staticTexts[TestIdentifiers.Dictionary.emptyPreview]
		XCTAssertTrue(trap.waitForExistence(timeout: 30), "the empty preview sheet never appeared")
		XCUIDevice.shared.orientation = orientation
		// The app's frame follows the device a moment after it turns.
		let rotated = Date().addingTimeInterval(5)
		while (app.frame.width > app.frame.height) != orientation.isLandscape && Date() < rotated {
			Thread.sleep(forTimeInterval: 0.25)
		}
		let frame = app.frame
		XCTAssertEqual(
			frame.width > frame.height, orientation.isLandscape,
			"the app should have rotated to \(orientation.rawValue), but its frame is \(frame)")

		let monkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")
		let escaped = monkey.escapeTrap()

		XCTAssertTrue(trap.waitForNonExistence(timeout: 5), "the monkey's escapes left the sheet up")
		XCTAssertTrue(
			app.descendants(matching: .any)[TestIdentifiers.Home.screen].exists,
			"Home should be under the sheet the monkey left")
		XCTAssertTrue(escaped, "the escape routine should report the screen it changed")
		let orientationName = orientation.isLandscape ? "landscape" : "portrait"
		XCTAssertTrue(
			monkey.warnings.contains { $0.hasPrefix("no escape hatch: ") && $0.hasSuffix("(\(orientationName))") },
			"the monkey should report the sheet as having no escape hatch, got \(monkey.warnings)")
	}
}
