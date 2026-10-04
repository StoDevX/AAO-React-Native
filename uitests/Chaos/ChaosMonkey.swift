import XCTest

/// What came of trying to leave a screen with nothing to press.
enum ChaosEscape: Equatable {
	/// The screen had something to press after all, so nothing was tried.
	case notTrapped
	/// An escape changed the screen.
	case escaped
	/// Every escape left the screen as it was; it was trapped in this
	/// orientation.
	case stuck(trappedIn: String)
	/// The app crashed or stopped answering while the monkey tried to leave.
	case stopped(ChaosStop)
}

/// Drives the app at random from a seed, checking the oracles after each step.
final class ChaosMonkey {
	private unowned let test: UITestCaseUnbooted
	private let seed: UInt64
	private let replay: Bool
	private let faultRate: String
	/// Whether `.rotate` turns the device. Off, it does nothing, but keeps its
	/// place in the pick table, so a seed takes the same steps either way.
	private let rotate: Bool
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
	/// How often each route has been opened this run, to favour the rest.
	private var routeOpens: [String: Int] = [:]
	/// How often each target has been tapped, keyed by screen title and target.
	private var taps: [String: Int] = [:]
	/// Target warnings already given, so each screen's target is reported once.
	private var reportedTargets: Set<String> = []
	/// The orientation the monkey last turned the device to. `.rotate`
	/// alternates from this rather than reading `XCUIDevice`, which does not
	/// reliably report it after a relaunch or a trip to the home screen, so a
	/// seed turns the same way on every run.
	private var orientation: UIDeviceOrientation = .portrait
	/// The orientation a hang was trapped in, before the escapes turned the
	/// device to portrait; nil unless every escape failed.
	private var hangOrientation: String?

	private var app: XCUIApplication { test.app }
	private let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

	/// Buttons that dismiss a system alert without granting anything, in order of preference.
	private static let alertDismissals = ["Don’t Allow", "Don't Allow", "Not Now", "Cancel", "OK"]

	init(test: UITestCaseUnbooted, seed: UInt64, replay: Bool, faultRate: String, rotate: Bool = false) {
		self.test = test
		self.seed = seed
		self.replay = replay
		self.faultRate = faultRate
		self.rotate = rotate
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
			let screen = observation.title
			guard
				let target = pickWeighted(
					observation.targets, uses: { self.taps["\(screen)|\(targetKey($0))", default: 0] }, using: &random)
			else { return nil }
			taps["\(screen)|\(targetKey(target))", default: 0] += 1
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
			let field = pickWeighted(observation.textFields, uses: { _ in 0 }, using: &random)
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
			goBack(on: observation)
			return nil
		case .openRoute:
			let route = pickWeighted(ChaosRoutes.all, uses: { self.routeOpens[$0, default: 0] }, using: &random)!
			routeOpens[route, default: 0] += 1
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
			guard rotate else {
				return ChaosTarget(identifier: "", label: "off", type: .any, frame: .zero)
			}
			orientation = orientation == .portrait ? .landscapeLeft : .portrait
			pauseHangClock { applyOrientation() }
			return nil
		}
	}

	/// Leaves the screen as a person would: the bar's Back button, else the
	/// topmost sheet dragged down, else a swipe in from the left edge.
	func goBack(on observation: ChaosObservation) {
		if !tapBackButton() && !dismissSheet(on: observation) {
			swipeFromLeftEdge()
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

	/// Tries each way a person might leave a screen with nothing to press,
	/// stopping at the first that changes it, and warns that the screen
	/// offered no visible way out. Draws nothing from `random`, so a run's
	/// later steps do not shift.
	///
	/// It first photographs the trapped screen, then turns the device to
	/// portrait: an iPhone form sheet in landscape fills the screen with no
	/// grabber and ignores a drag down, and rotating gives it back the
	/// grabber to drag. Each escape is judged against the screen just before
	/// it, so rotating is never credited to the escape that follows. When the
	/// trap is a sheet, an escape works only if the sheet goes or the screen's
	/// signature changes; otherwise a changed signature, or something to
	/// press where there was nothing, will do.
	func escapeTrap() -> ChaosEscape {
		let trapped: ChaosObservation
		switch ChaosOracle(app: app).observe() {
		case .failure(let stop): return .stopped(stop)
		case .success(let observed): trapped = observed
		}
		// The screen finished loading after the hang check looked.
		guard trapped.targets.isEmpty else { return .notTrapped }

		let trappedIn = Self.name(appIsLandscape)
		let screen = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
		screen.name = "chaos trapped screen (\(trappedIn))"
		screen.lifetime = .keepAlways
		test.add(screen)

		let escapes: [(ChaosObservation) -> Void] = [
			{ _ = self.dismissSheet(on: $0) },
			{ _ in _ = self.tapBackButton() },
			{ _ in self.swipeFromLeftEdge() },
		]
		var outcome = ChaosEscape.stuck(trappedIn: trappedIn)
		pauseHangClock {
			// Set whatever the monkey believes: a caller may have turned the
			// device without it.
			orientation = .portrait
			applyOrientation()
			for escape in escapes {
				if let crash = crashStop() {
					outcome = .stopped(crash)
					return
				}
				let before: ChaosObservation
				switch ChaosOracle(app: app).observe() {
				case .failure(let stop):
					outcome = .stopped(stop)
					return
				case .success(let observed): before = observed
				}
				escape(before)
				Thread.sleep(forTimeInterval: 1)
				if let crash = crashStop() {
					outcome = .stopped(crash)
					return
				}
				let after: ChaosObservation
				switch ChaosOracle(app: app).observe() {
				case .failure(let stop):
					outcome = .stopped(stop)
					return
				case .success(let observed): after = observed
				}
				let changed = after.signature != before.signature
				let left = trapped.sheet != nil
					? changed || after.sheet == nil
					: changed || (before.targets.isEmpty && !after.targets.isEmpty)
				if left {
					outcome = .escaped
					return
				}
			}
		}
		if outcome == .escaped {
			warnings.append("no escape hatch: \(trapped.signature) (\(trappedIn))")
		}
		return outcome
	}

	/// A stop if the app is no longer running.
	private func crashStop() -> ChaosStop? {
		switch app.state {
		case .notRunning, .unknown: ChaosStop("native crash: the app is not running")
		default: nil
		}
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

	/// Runs one of the monkey's own waits without counting it towards a hang.
	private func pauseHangClock(_ wait: () -> Void) {
		let start = Date()
		wait()
		lastTargetsSeen += Date().timeIntervalSince(start)
	}

	/// Taps the middle of `frame` through SpringBoard. A tap on the app does not
	/// return until the app goes quiet, which it cannot while a SpringBoard
	/// alert, such as the one an icon change raises, is up: the tap would cost a
	/// minute or more after it had landed. SpringBoard is quiet, and the screen
	/// point is the same, so the tap returns at once and the check after the
	/// step dismisses the alert.
	func tap(_ frame: CGRect) {
		springboard.coordinate(withNormalizedOffset: .zero)
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
		checkTargets(observation)

		if observation.targets.isEmpty {
			if Date().timeIntervalSince(lastTargetsSeen) > 15 {
				switch escapeTrap() {
				case .stopped(let stop):
					return stop
				case .stuck(let trappedIn):
					hangOrientation = trappedIn
					return ChaosStop("hang: nothing to press for 15 seconds")
				case .escaped, .notTrapped:
					// The screen changed, so this observation is stale.
					lastTargetsSeen = Date()
					backsWithoutChange = 0
					lastSignature = ""
					return nil
				}
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

	/// Warns once per screen and target of a control VoiceOver cannot name, or
	/// one smaller than 44pt a side. Text fields are exempt from the size check,
	/// as is the navigation bar's Back button, which the system draws.
	func checkTargets(_ observation: ChaosObservation) {
		let screen = observation.title
		for target in observation.targets {
			let key = targetKey(target)
			let size = "\(Int(target.frame.width))×\(Int(target.frame.height))"
			if target.label.isEmpty, reportedTargets.insert("unlabelled|\(screen)|\(key)").inserted {
				warnings.append("unlabelled: \(key) \(size) on \"\(screen)\"")
			}
			let exempt =
				target.type == .textField || target.type == .searchField
				|| target.identifier == TestIdentifiers.Navigation.backButton
				|| TestIdentifiers.Chaos.smallTargetAllowList.contains(target.identifier)
			let small = target.frame.width < 44 || target.frame.height < 44
			if small && !exempt, reportedTargets.insert("small|\(screen)|\(key)").inserted {
				warnings.append("small target: \(key) \(size) on \"\(screen)\"")
			}
		}
	}

	/// Dismisses a system alert, such as a permission prompt, that sits over
	/// the app. Checked after every step rather than left to an interruption
	/// monitor, which only runs when the test touches an element, and the
	/// monkey taps by coordinate.
	func dismissSystemAlert() {
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
			"type": Int(target?.type.rawValue ?? 0),
			"frame": target.map {
				"\(Int($0.frame.minX)),\(Int($0.frame.minY)),\(Int($0.frame.width)),\(Int($0.frame.height))"
			} ?? "",
		]
		if let data = try? JSONSerialization.data(withJSONObject: entry, options: [.sortedKeys]),
			let line = String(data: data, encoding: .utf8)
		{
			steps.append(line)
		}
	}

	/// Records the stop with a screenshot taken now: the teardown block turns
	/// the device back to portrait before XCTest photographs a failure, so
	/// that picture would not show a landscape stop as it was. A hang names
	/// the orientation it was trapped in, which its escapes have since undone.
	private func fail(_ stop: ChaosStop, step: Int) {
		stopReason = stop.reason
		let shown = Self.name(app.state == .runningForeground ? appIsLandscape : orientation.isLandscape)
		let screen = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
		screen.name = "chaos stop screen (\(shown))"
		screen.lifetime = .keepAlways
		test.add(screen)
		XCTFail("chaos seed \(seed) stopped at step \(step) in \(hangOrientation ?? shown): \(stop.reason)")
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
