import XCTest

/// Drives the app at random from a seed, checking the oracles after each step.
final class ChaosMonkey {
	private unowned let test: UITestCaseUnbooted
	private let seed: UInt64
	private let replay: Bool
	private let faultRate: String
	private var random: ChaosRandom
	private var launch = 0
	private var steps: [String] = []
	/// Why an oracle stopped the run; nil while it is within its budget.
	private var stopReason: String?
	/// Things worth knowing that did not stop the run.
	private(set) var warnings: [String] = []
	private var lastTargetsSeen = Date()
	private var backsWithoutChange = 0
	private var lastSignature = ""
	/// The orientation the monkey last turned the device to. `.rotate`
	/// alternates from this rather than reading `XCUIDevice`, which does not
	/// reliably report it after a relaunch or a trip to the home screen, so a
	/// seed turns the same way on every run.
	private var orientation: UIDeviceOrientation = .portrait

	private var app: XCUIApplication { test.app }
	private let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

	/// Buttons that dismiss a system alert without granting anything, in order of preference.
	private static let alertDismissals = ["Don’t Allow", "Don't Allow", "Not Now", "Cancel", "OK"]

	init(test: UITestCaseUnbooted, seed: UInt64, replay: Bool, faultRate: String) {
		self.test = test
		self.seed = seed
		self.replay = replay
		self.faultRate = faultRate
		self.random = ChaosRandom(seed: seed)
	}

	/// Runs until `steps` or `duration` runs out, or an oracle stops it.
	func run(steps budget: Int, duration: TimeInterval) {
		let deadline = Date().addingTimeInterval(duration)
		// A teardown block rather than `defer`: a failure stops the test
		// without unwinding Swift, so a `defer` would lose the logs of exactly
		// the runs that need them. `.rotate` can leave the simulator in
		// landscape, which the next UI test on it would inherit.
		test.addTeardownBlock {
			self.attachLogs()
			XCUIDevice.shared.orientation = .portrait
		}
		test.configureForChaos(seed: seed, launch: launch, replay: replay, faultRate: faultRate, resetState: true)
		app.launch()
		if let stop = ChaosOracle(app: app).waitForProbe(timeout: 30) {
			return fail(stop, step: 0)
		}
		applyOrientation()
		lastTargetsSeen = Date()

		for step in 0..<budget where Date() < deadline {
			let action = ChaosAction.pick(using: &random)
			let observation: ChaosObservation
			switch ChaosOracle(app: app).observe() {
			case .failure(let stop): return fail(stop, step: step)
			case .success(let observed): observation = observed
			}
			let target = perform(action, on: observation)
			log(step: step, action: action, target: target)

			if let stop = checkAfter(action) {
				return fail(stop, step: step)
			}
		}
	}

	// MARK: - Actions

	/// Every action draws the same values from `random` whatever is on screen,
	/// so a seed's later steps do not shift when a screen has more or fewer
	/// targets, or the keyboard is slow to appear.
	private func perform(_ action: ChaosAction, on observation: ChaosObservation) -> ChaosTarget? {
		switch action {
		case .tap:
			guard let target = pick(from: observation.targets) else { return nil }
			tap(target.frame)
			return target
		case .scroll:
			let directions: [(CGVector, CGVector)] = [
				(CGVector(dx: 0.5, dy: 0.8), CGVector(dx: 0.5, dy: 0.2)),
				(CGVector(dx: 0.5, dy: 0.2), CGVector(dx: 0.5, dy: 0.8)),
				(CGVector(dx: 0.8, dy: 0.5), CGVector(dx: 0.2, dy: 0.5)),
			]
			let (from, to) = directions.randomElement(using: &random)!
			app.coordinate(withNormalizedOffset: from).press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: to))
			return nil
		case .type:
			let field = pick(from: observation.textFields)
			let text = chaosStrings.randomElement(using: &random)!
			let submit = Bool.random(using: &random)
			guard let field else { return nil }
			tap(field.frame)
			pauseHangClock {
				// typeText fails the whole test when nothing has focus.
				if app.keyboards.firstMatch.waitForExistence(timeout: 2) {
					app.typeText(text + (submit ? "\n" : ""))
				}
			}
			return field
		case .back:
			if !tapBackButton() && !dismissSheet(on: observation) {
				swipeFromLeftEdge()
			}
			return nil
		case .openRoute:
			let route = ChaosRoutes.all.randomElement(using: &random)!
			let filled = route.replacingOccurrences(
				of: #"\[(\.\.\.)?[^\]]+\]"#,
				with: chaosSegmentValues.randomElement(using: &random)!,
				options: .regularExpression)
			launch += 1
			test.configureForChaos(seed: seed, launch: launch, replay: replay, faultRate: faultRate, resetState: false)
			app.open(URL(string: "AllAboutOlaf://\(filled)") ?? URL(string: "AllAboutOlaf://")!)
			return ChaosTarget(identifier: "route", label: filled, type: .any, frame: .zero)
		case .background:
			pauseHangClock {
				XCUIDevice.shared.press(.home)
				app.activate()
				// activate() can return before the app is frontmost, which the
				// check after this step would report as escaping the app.
				_ = app.wait(for: .runningForeground, timeout: 10)
				applyOrientation()
			}
			return nil
		case .rotate:
			orientation = orientation == .portrait ? .landscapeLeft : .portrait
			pauseHangClock { applyOrientation() }
			return nil
		}
	}

	/// Taps the navigation bar's Back button, if one can be tapped.
	private func tapBackButton() -> Bool {
		let back = app.navigationBars.buttons[TestIdentifiers.Navigation.backButton].firstMatch
		guard back.exists && back.isHittable else { return false }
		back.tap()
		return true
	}

	/// Drags the topmost sheet down by its grabber, or by its top edge when it
	/// has none, as a person dismisses a sheet with no Close button.
	private func dismissSheet(on observation: ChaosObservation) -> Bool {
		let start: CGPoint
		if let grabber = observation.grabber {
			start = CGPoint(x: grabber.midX, y: grabber.midY)
		} else if let sheet = observation.sheet {
			start = CGPoint(x: sheet.midX, y: sheet.minY + 10)
		} else {
			return false
		}
		let origin = app.coordinate(withNormalizedOffset: .zero)
		origin.withOffset(CGVector(dx: start.x, dy: start.y))
			.press(forDuration: 0.05, thenDragTo: origin.withOffset(CGVector(dx: start.x, dy: app.frame.maxY - 2)))
		return true
	}

	private func swipeFromLeftEdge() {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.5))
			.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5)))
	}

	// MARK: - Escapes

	/// Tries each way a person might leave the screen, stopping at the first
	/// that changes it, and warns that the screen offered no visible way out.
	/// Draws nothing from `random`, so a run's later steps do not shift.
	///
	/// Rotating to portrait comes first but is not judged alone: an iPhone
	/// form sheet in landscape fills the screen with no grabber and ignores a
	/// drag down, and rotating only gives it back the grabber to drag.
	@discardableResult
	func escapeTrap() -> Bool {
		guard case .success(let trapped) = ChaosOracle(app: app).observe() else { return false }
		let trappedIn = Self.name(appIsLandscape)
		let escapes: [(ChaosObservation) -> Void] = [
			{ _ = self.dismissSheet(on: $0) },
			{ _ in _ = self.tapBackButton() },
			{ _ in self.swipeFromLeftEdge() },
		]
		var escaped = false
		pauseHangClock {
			// Set whatever the monkey believes: a caller may have turned the
			// device without it.
			orientation = .portrait
			applyOrientation()
			for escape in escapes {
				guard case .success(let before) = ChaosOracle(app: app).observe() else { continue }
				escape(before)
				Thread.sleep(forTimeInterval: 1)
				guard case .success(let after) = ChaosOracle(app: app).observe() else { continue }
				if after.signature != trapped.signature || !after.targets.isEmpty
					|| (trapped.sheet != nil && after.sheet == nil)
				{
					escaped = true
					return
				}
			}
		}
		if escaped {
			warnings.append("no escape hatch: \(trapped.signature) (\(trappedIn))")
		}
		return escaped
	}

	/// Turns the device to `orientation` and waits for the app to follow, so
	/// the device matches what the monkey believes and logs. Its caller keeps
	/// the wait off the hang clock.
	private func applyOrientation() {
		XCUIDevice.shared.orientation = orientation
		// A frame read from an app that is not frontmost fails the test.
		guard app.state == .runningForeground else { return }
		let deadline = Date().addingTimeInterval(3)
		while appIsLandscape != orientation.isLandscape && Date() < deadline {
			Thread.sleep(forTimeInterval: 0.25)
		}
		if appIsLandscape != orientation.isLandscape {
			warnings.append("orientation: the app stayed \(Self.name(appIsLandscape)) after the monkey turned it \(Self.name(orientation.isLandscape))")
		}
	}

	private var appIsLandscape: Bool { app.frame.width > app.frame.height }

	private static func name(_ landscape: Bool) -> String { landscape ? "landscape" : "portrait" }

	/// One of `items`, drawing from `random` even when there are none.
	private func pick<Item>(from items: [Item]) -> Item? {
		let choice = Int.random(in: 0..<Int.max, using: &random)
		return items.isEmpty ? nil : items[choice % items.count]
	}

	/// Runs one of the monkey's own waits without counting it towards a hang.
	private func pauseHangClock(_ wait: () -> Void) {
		let start = Date()
		wait()
		lastTargetsSeen += Date().timeIntervalSince(start)
	}

	private func tap(_ frame: CGRect) {
		app.coordinate(withNormalizedOffset: .zero)
			.withOffset(CGVector(dx: frame.midX, dy: frame.midY))
			.tap()
	}

	// MARK: - Oracles

	private func checkAfter(_ action: ChaosAction) -> ChaosStop? {
		// Opening a route relaunched the app; give its bundle time to run.
		if action == .openRoute {
			if let stop = ChaosOracle(app: app).waitForProbe(timeout: 30) {
				return app.state == .runningForeground ? stop : ChaosStop("native crash: the app is not running")
			}
			// A relaunched app takes the device's orientation, which may not be
			// the one the monkey last chose.
			applyOrientation()
			// A fresh launch: the time it took to start is not a hang.
			lastTargetsSeen = Date()
		}

		dismissSystemAlert()

		switch app.state {
		case .runningForeground:
			break
		case .notRunning, .unknown:
			return ChaosStop("native crash: the app is not running")
		default:
			warnings.append("escaped the app (state \(app.state.rawValue)) after \(action.rawValue)")
			app.activate()
		}

		let oracle = ChaosOracle(app: app)
		let observation: ChaosObservation
		switch oracle.observe() {
		case .failure(let stop): return stop
		case .success(let observed): observation = observed
		}
		if let stop = oracle.stopReason(observation) {
			return stop
		}

		if observation.targets.isEmpty {
			if Date().timeIntervalSince(lastTargetsSeen) > 15 {
				guard escapeTrap() else { return ChaosStop("hang: nothing to press for 15 seconds") }
				// The escape changed the screen, so this observation is stale.
				lastTargetsSeen = Date()
				backsWithoutChange = 0
				lastSignature = ""
				return nil
			}
		} else {
			lastTargetsSeen = Date()
		}

		if action == .back {
			backsWithoutChange = observation.signature == lastSignature ? backsWithoutChange + 1 : 0
			if backsWithoutChange == 3 {
				let screen = observation.sheet == nil ? "" : "a sheet: "
				warnings.append("dead end: Back changed nothing three times on \(screen)\(observation.signature)")
			}
		}
		lastSignature = observation.signature
		return nil
	}

	/// Dismisses a system alert, such as a permission prompt, that sits over
	/// the app. Checked after every step rather than left to an interruption
	/// monitor, which only runs when the test touches an element, and the
	/// monkey taps by coordinate.
	private func dismissSystemAlert() {
		let alert = springboard.alerts.firstMatch
		guard alert.exists else { return }
		warnings.append("system alert: \(alert.label)")
		pauseHangClock {
			if let label = Self.alertDismissals.first(where: { alert.buttons[$0].exists }) {
				alert.buttons[label].tap()
			} else {
				warnings.append("system alert had no button to dismiss it with: \(alert.label)")
			}
		}
	}

	// MARK: - Evidence

	private func log(step: Int, action: ChaosAction, target: ChaosTarget?) {
		let entry: [String: Any] = [
			"step": step,
			"launch": launch,
			"action": action.rawValue,
			"orientation": Self.name(orientation.isLandscape),
			"identifier": target?.identifier ?? "",
			"label": target?.label ?? "",
		]
		if let data = try? JSONSerialization.data(withJSONObject: entry, options: [.sortedKeys]),
			let line = String(data: data, encoding: .utf8)
		{
			steps.append(line)
		}
	}

	/// Records the stop with a screenshot taken now: the teardown block turns
	/// the device back to portrait before XCTest photographs a failure, so
	/// that picture would not show a landscape stop as it was.
	private func fail(_ stop: ChaosStop, step: Int) {
		stopReason = stop.reason
		let shown = Self.name(app.state == .runningForeground ? appIsLandscape : orientation.isLandscape)
		let screen = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
		screen.name = "chaos stop screen (\(shown))"
		screen.lifetime = .keepAlways
		test.add(screen)
		XCTFail("chaos seed \(seed) stopped at step \(step) in \(shown): \(stop.reason)")
	}

	private func attachLogs() {
		let stepLog = XCTAttachment(string: steps.joined(separator: "\n") + "\n")
		stepLog.name = "chaos-steps.jsonl"
		stepLog.lifetime = .keepAlways
		test.add(stepLog)

		let warningLog = XCTAttachment(string: warnings.joined(separator: "\n") + "\n")
		warningLog.name = "chaos-warnings.txt"
		warningLog.lifetime = .keepAlways
		test.add(warningLog)

		// Absent when the run used up its budget: mise run chaos reads its
		// presence as the monkey having stopped on something.
		if let stopReason {
			let stopLog = XCTAttachment(string: stopReason)
			stopLog.name = "chaos-stop.txt"
			stopLog.lifetime = .keepAlways
			test.add(stopLog)
		}
	}
}
