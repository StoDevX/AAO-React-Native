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
			faultRate: env["AAO_CHAOS_FAULT_RATE"] ?? "0.25",
			rotate: env["AAO_CHAOS_ROTATE"] == "1")
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

	/// The monkey taps through SpringBoard with frames read from the app, so
	/// the two must agree on where a point is in landscape too, as under
	/// `--rotate`: a tap on Customize's App Icon row should open the gallery.
	func testTapsTheRightPlaceInLandscape() {
		addTeardownBlock { XCUIDevice.shared.orientation = .portrait }
		configureForChaos(seed: 1, launch: 0, replay: false, faultRate: "0", resetState: true)
		app.launch()
		_ = HomeScreen(app: app).checkHomescreenExists().openCustomize()
		XCUIDevice.shared.orientation = .landscapeLeft
		let rotated = Date().addingTimeInterval(5)
		while app.frame.width <= app.frame.height && Date() < rotated {
			Thread.sleep(forTimeInterval: 0.25)
		}
		XCTAssertGreaterThan(app.frame.width, app.frame.height, "the app should have turned to landscape")
		let row = app.buttons[TestIdentifiers.Customize.appIconRow].firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 10), "Customize should offer App Icon")
		let monkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")
		monkey.tap(row.frame)
		XCTAssertTrue(
			AppIconScreen(app: app).gallery.waitForExistence(timeout: 10),
			"the monkey's tap on the App Icon row at \(row.frame) should have opened the gallery")
	}

	/// A screen with one tiny, unlabelled button: both oracles should warn,
	/// once each, however often the monkey looks.
	func testWarnsOfAnUnlabelledSmallTarget() {
		configureForChaos(seed: 1, launch: 0, replay: false, faultRate: "0", resetState: true)
		app.open(URL(string: "AllAboutOlaf://\(TestIdentifiers.Chaos.targetsCanaryRoute)")!)
		XCTAssertTrue(
			app.descendants(matching: .any)[TestIdentifiers.Chaos.targetsCanaryButton].waitForExistence(timeout: 30),
			"the canary screen never loaded")
		let monkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")
		for _ in 0..<3 {
			guard case .success(let observation) = ChaosOracle(app: app).observe() else {
				return XCTFail("the canary screen should give a snapshot")
			}
			monkey.checkTargets(observation)
		}
		let key = "id:\(TestIdentifiers.Chaos.targetsCanaryButton)"
		XCTAssertEqual(monkey.warnings.filter { $0.hasPrefix("unlabelled: \(key) ") }.count, 1, "\(monkey.warnings)")
		XCTAssertEqual(monkey.warnings.filter { $0.hasPrefix("small target: \(key) ") }.count, 1, "\(monkey.warnings)")
	}

	/// Changing the app icon raises SpringBoard's alert, which keeps the app
	/// from going quiet: a tap that waits for the app costs a minute or more,
	/// and the monkey sits on the screen. Its tap should return at once, and the
	/// check after the step should dismiss the alert.
	func testTapsPastTheIconChangeAlert() {
		configureForChaos(seed: 1, launch: 0, replay: false, faultRate: "0", resetState: true)
		app.launch()
		let gallery = AppIconScreen(app: app).navigate()
		let name = gallery.icon(named: "Big Ole").isSelected ? "Old Main" : "Big Ole"
		let tile = gallery.icon(named: name)
		gallery.scrollIntoView(tile)
		let frame = tile.frame
		let monkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")

		let start = Date()
		monkey.tap(frame)
		XCTAssertLessThan(Date().timeIntervalSince(start), 15, "the tap should not wait for the app behind the alert")

		let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
		XCTAssertTrue(springboard.alerts.firstMatch.waitForExistence(timeout: 10), "the icon change should raise its alert")
		monkey.dismissSystemAlert()
		XCTAssertTrue(springboard.alerts.firstMatch.waitForNonExistence(timeout: 10), "the monkey should dismiss the alert")
		XCTAssertTrue(monkey.warnings.contains { $0.hasPrefix("system alert: ") }, "\(monkey.warnings)")
	}

	/// In portrait the sheet's grabber is something to press, so it is no
	/// trap; Back drags the sheet away by it. Opened again in landscape, an
	/// iPhone form sheet fills the screen and draws no grabber, so the monkey
	/// has to rotate before it can leave.
	func testLeavesASheetInPortraitAndEscapesItInLandscape() {
		let trap = openSheetTrap(in: .portrait)
		let monkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")
		XCTAssertEqual(monkey.escapeTrap(), .notTrapped, "a sheet with a grabber is not a trap")
		XCTAssertEqual(monkey.warnings, [], "nothing was escaped, so nothing should be reported")

		// The empty preview's text is there while the sheet is still rising,
		// and a drag from where the grabber was misses it.
		var observation: ChaosObservation?
		let settled = Date().addingTimeInterval(5)
		while Date() < settled {
			guard case .success(let observed) = ChaosOracle(app: app).observe() else { break }
			if let grabber = observed.grabber, grabber == observation?.grabber { break }
			observation = observed
			Thread.sleep(forTimeInterval: 0.5)
		}
		guard let observation, observation.grabber != nil else {
			return XCTFail("the oracle should see the sheet's grabber")
		}
		monkey.goBack(on: observation)

		assertSheetIsGone(trap)

		let landscapeTrap = openSheetTrap(in: .landscapeLeft)
		let landscapeMonkey = ChaosMonkey(test: self, seed: 1, replay: false, faultRate: "0")
		XCTAssertEqual(landscapeMonkey.escapeTrap(), .escaped, "an escape should have changed the screen")

		assertSheetIsGone(landscapeTrap)
		XCTAssertTrue(
			landscapeMonkey.warnings.contains { $0.hasPrefix("no escape hatch: ") && $0.hasSuffix("(landscape)") },
			"the monkey should report the sheet as having no escape hatch, got \(landscapeMonkey.warnings)")
	}

	/// Opens the Dictionary's empty preview, a sheet with no Back or Close
	/// button, in `orientation`, and returns its text.
	private func openSheetTrap(in orientation: UIDeviceOrientation) -> XCUIElement {
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
		return trap
	}

	private func assertSheetIsGone(_ trap: XCUIElement) {
		XCTAssertTrue(trap.waitForNonExistence(timeout: 5), "the monkey left the sheet up")
		guard case .success(let observation) = ChaosOracle(app: app).observe() else {
			return XCTFail("the screen under the sheet should give a snapshot")
		}
		XCTAssertNil(observation.sheet, "no sheet should be presented once the monkey has left it")
	}
}
