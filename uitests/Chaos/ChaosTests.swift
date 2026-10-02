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
}
