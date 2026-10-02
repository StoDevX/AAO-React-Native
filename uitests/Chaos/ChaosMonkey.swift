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
	private var warnings: [String] = []
	private var lastTargetsSeen = Date()
	private var backsWithoutChange = 0
	private var lastSignature = ""

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
		// the runs that need them.
		test.addTeardownBlock { self.attachLogs() }
		test.configureForChaos(seed: seed, launch: launch, replay: replay, faultRate: faultRate, resetState: true)
		app.launch()
		if let stop = ChaosOracle(app: app).waitForProbe(timeout: 30) {
			return fail(stop, step: 0)
		}
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
			let back = app.navigationBars.buttons[TestIdentifiers.Navigation.backButton].firstMatch
			if back.exists && back.isHittable {
				back.tap()
			} else {
				app.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.5))
					.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5)))
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
			}
			return nil
		case .rotate:
			let orientation: UIDeviceOrientation = XCUIDevice.shared.orientation == .portrait ? .landscapeLeft : .portrait
			XCUIDevice.shared.orientation = orientation
			return nil
		}
	}

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
				return ChaosStop("hang: nothing to press for 15 seconds")
			}
		} else {
			lastTargetsSeen = Date()
		}

		if action == .back {
			backsWithoutChange = observation.signature == lastSignature ? backsWithoutChange + 1 : 0
			if backsWithoutChange == 3 {
				warnings.append("dead end: Back changed nothing three times on \(observation.signature)")
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
			"identifier": target?.identifier ?? "",
			"label": target?.label ?? "",
		]
		if let data = try? JSONSerialization.data(withJSONObject: entry, options: [.sortedKeys]),
			let line = String(data: data, encoding: .utf8)
		{
			steps.append(line)
		}
	}

	private func fail(_ stop: ChaosStop, step: Int) {
		XCTFail("chaos seed \(seed) stopped at step \(step): \(stop.reason)")
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
	}
}
