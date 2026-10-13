import XCTest

/// Something on screen the monkey could act on.
struct ChaosTarget {
	let identifier: String
	let label: String
	let type: XCUIElement.ElementType
	let frame: CGRect
	/// Whether it sits in a navigation bar, toolbar or tab bar, whose items the
	/// system draws and gives a 44pt hit area whatever their frame.
	var inBar = false
}

/// What the screen looked like after a step, from one accessibility snapshot.
struct ChaosObservation {
	let beaconLabel: String?
	let errorScreen: String?
	let targets: [ChaosTarget]
	let textFields: [ChaosTarget]
	/// Enough of the screen to tell whether Back changed anything.
	let signature: String
	/// The frame of the topmost sheet or other modal, if one is presented.
	let sheet: CGRect?
	/// The topmost sheet's grabber, which UIKit draws only on a sheet that
	/// does not fill the screen.
	let grabber: CGRect?
	/// The navigation bar's title, or "" with none: names the screen without
	/// the data on it, so two calendar events count as one screen.
	let title: String
	/// Strings the app has received, for a session to type.
	var vocab: [String] = []
	/// The app's network element: `online`, `offline`, or nil when it is not drawn.
	var network: String?
	/// Whether an activity indicator is on screen.
	var hasSpinner = false
}

/// Reads one snapshot of the app and decides whether the run should stop.
struct ChaosOracle {
	let app: XCUIApplication

	private static let actionable: Set<XCUIElement.ElementType> = [
		.button, .cell, .link, .switch, .tab, .segmentedControl, .slider, .textField, .searchField, .other,
	]

	/// One snapshot of the screen, or a stop reason if the app could not give one.
	func observe() -> Result<ChaosObservation, ChaosStop> {
		let snapshot: XCUIElementSnapshot
		do {
			snapshot = try app.snapshot()
		} catch {
			return .failure(ChaosStop("hang: no accessibility snapshot (\(error.localizedDescription))"))
		}
		let screen = snapshot.frame
		var beacon: String?
		var errorScreen: String?
		var targets: [ChaosTarget] = []
		var fields: [ChaosTarget] = []
		var signatureParts: [String] = []
		var grabber: CGRect?
		var title = ""
		var vocab: [String] = []
		var network: String?
		var hasSpinner = false

		func visit(_ node: XCUIElementSnapshot, inBar: Bool) {
			let id = node.identifier
			if id == TestIdentifiers.Chaos.beacon {
				beacon = node.label
				return
			}
			if id == TestIdentifiers.Chaos.vocab {
				vocab = node.label.split(separator: TestIdentifiers.Chaos.vocabSeparator).map(String.init)
				return
			}
			if id == TestIdentifiers.Chaos.network {
				network = node.label
				return
			}
			if node.elementType == .activityIndicator && node.frame.width >= 2 { hasSpinner = true }
			// The keyboard's keys are not the app's; the type action does the typing.
			if node.elementType == .keyboard { return }
			if node.elementType == .navigationBar && title.isEmpty {
				title = id.isEmpty ? node.label : id
			}
			if TestIdentifiers.Chaos.errorScreenIdentifiers.contains(id)
				|| TestIdentifiers.Chaos.errorScreenLabels.contains(node.label)
			{
				errorScreen = id.isEmpty ? node.label : id
			}
			if node.elementType == .navigationBar || node.elementType == .staticText, signatureParts.count < 12 {
				signatureParts.append(node.label)
			}
			let frame = node.frame
			// The last in tree order belongs to the topmost of stacked sheets.
			if node.elementType == .button && node.label == TestIdentifiers.Navigation.sheetGrabber {
				grabber = frame
			}
			let onScreen = frame.width >= 2 && frame.height >= 2 && screen.intersects(frame)
			// An `.other` with no identifier is layout, not something to press.
			let pressable = Self.actionable.contains(node.elementType)
				&& (node.elementType != .other || !id.isEmpty)
			if onScreen && pressable && node.isEnabled {
				let target = ChaosTarget(
					identifier: id, label: node.label, type: node.elementType, frame: frame, inBar: inBar)
				targets.append(target)
				if node.elementType == .textField || node.elementType == .searchField {
					fields.append(target)
				}
			}
			let bars: Set<XCUIElement.ElementType> = [.navigationBar, .toolbar, .tabBar]
			for child in node.children {
				visit(child, inBar: inBar || bars.contains(node.elementType))
			}
		}
		visit(snapshot, inBar: false)

		// Sorted by position so the same screen gives the same order on replay.
		let byPosition: (ChaosTarget, ChaosTarget) -> Bool = {
			($0.frame.minY, $0.frame.minX) < ($1.frame.minY, $1.frame.minX)
		}
		return .success(
			ChaosObservation(
				beaconLabel: beacon,
				errorScreen: errorScreen,
				targets: targets.sorted(by: byPosition),
				textFields: fields.sorted(by: byPosition),
				signature: signatureParts.joined(separator: "|"),
				sheet: Self.topmostModal(in: snapshot),
				grabber: grabber,
				title: title,
				vocab: vocab,
				network: network,
				hasSpinner: hasSpinner))
	}

	/// The frame of the topmost presented modal. UIKit gives each sheet or
	/// modal it presents a container among the window's children, holding a
	/// dimming region that overhangs the screen and then the sheet itself. A
	/// snapshot leaves out the screens beneath an accessibility-modal sheet,
	/// so the container may be the window's only child.
	private static func topmostModal(in snapshot: XCUIElementSnapshot) -> CGRect? {
		let screen = snapshot.frame
		let fits = screen.insetBy(dx: -1, dy: -1)
		guard let window = snapshot.children.first(where: { $0.elementType == .window }) else { return nil }
		for container in window.children.reversed() {
			guard let dimming = container.children.first,
				dimming.frame.contains(screen), dimming.frame != screen
			else { continue }
			return container.children.dropFirst().map(\.frame).first { fits.contains($0) && $0.width >= 2 && $0.height >= 2 }
		}
		return nil
	}

	/// Why the run must stop now, if it must. A missing beacon is not a reason:
	/// a full-screen modal or form sheet can take it out of the accessibility
	/// tree, so only `waitForProbe` decides the probe is silent.
	func stopReason(_ observation: ChaosObservation) -> ChaosStop? {
		if let beacon = observation.beaconLabel, beacon != TestIdentifiers.Chaos.beaconQuiet {
			return ChaosStop("js: \(beacon)")
		}
		// The chaos boundary draws its fallback a render before the beacon
		// carries the error's message, so a quiet beacon over it means "not
		// yet", and the next observation reports the error itself.
		if observation.errorScreen == TestIdentifiers.Chaos.fatalBoundary,
			observation.beaconLabel == TestIdentifiers.Chaos.beaconQuiet
		{
			return nil
		}
		if let screen = observation.errorScreen {
			return ChaosStop("error screen: \(screen)")
		}
		return nil
	}

	/// Waits for the beacon after a launch: React Native draws nothing until
	/// its bundle has run, so a missing beacon means "not yet" until `timeout`.
	func waitForProbe(timeout: TimeInterval) -> ChaosStop? {
		let found = app.descendants(matching: .any)[TestIdentifiers.Chaos.beacon].waitForExistence(timeout: timeout)
		return found ? nil : ChaosStop("probe silent: no \(TestIdentifiers.Chaos.beacon) element")
	}

	/// Polls until something stops the run, or returns nil once `timeout` has
	/// passed with nothing to report.
	func waitForStop(timeout: TimeInterval) -> String? {
		let deadline = Date().addingTimeInterval(timeout)
		while Date() < deadline {
			switch observe() {
			case .failure(let stop):
				return stop.reason
			case .success(let observation):
				if let stop = stopReason(observation) {
					return stop.reason
				}
			}
			Thread.sleep(forTimeInterval: 0.5)
		}
		return nil
	}
}

/// Why a chaos run stopped.
struct ChaosStop: Error, Equatable {
	let reason: String
	init(_ reason: String) { self.reason = reason }
}

/// Controls VoiceOver names from their own label. A cell's text sits in its
/// children, and an `.other` the oracle counts as pressable is mostly layout,
/// so neither is checked for a label.
private let labelledTypes: Set<XCUIElement.ElementType> = [
	.button, .link, .switch, .tab, .segmentedControl, .slider,
]

/// The accessibility warnings the targets on screen deserve, each with the key
/// that reports it once per run: a control VoiceOver cannot name, and one
/// smaller than 44pt a side. The system's own controls are left alone: the
/// Back button and the sheet grabber, a bar's items, whose hit area the system
/// sets, and switches, which are as big as UIKit draws them. Text fields are
/// exempt from the size check.
func targetWarnings(_ observation: ChaosObservation) -> [(key: String, warning: String)] {
	let screen = observation.title
	var found: [(key: String, warning: String)] = []
	for target in observation.targets {
		let key = targetKey(target)
		let size = "\(Int(target.frame.width))×\(Int(target.frame.height))"
		// A target with no name is keyed by where it sits, which a scroll
		// changes; it is reported once by its type and size instead.
		let named = !target.identifier.isEmpty || !target.label.isEmpty
		let once = named ? key : "\(target.type.rawValue)|\(size)"
		let system =
			target.identifier == TestIdentifiers.Navigation.backButton
			|| target.label == TestIdentifiers.Navigation.sheetGrabber || target.inBar
		if system { continue }
		if target.label.isEmpty && labelledTypes.contains(target.type) {
			found.append(("unlabelled|\(screen)|\(once)", "unlabelled: \(key) \(size) on \"\(screen)\""))
		}
		let sized = ![.textField, .searchField, .switch].contains(target.type)
			&& !TestIdentifiers.Chaos.smallTargetAllowList.contains(target.identifier)
		if sized && (target.frame.width < 44 || target.frame.height < 44) {
			found.append(("small|\(screen)|\(once)", "small target: \(key) \(size) on \"\(screen)\""))
		}
	}
	return found
}
