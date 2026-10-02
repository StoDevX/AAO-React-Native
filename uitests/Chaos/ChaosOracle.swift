import XCTest

/// Something on screen the monkey could act on.
struct ChaosTarget {
	let identifier: String
	let label: String
	let type: XCUIElement.ElementType
	let frame: CGRect
}

/// What the screen looked like after a step, from one accessibility snapshot.
struct ChaosObservation {
	let beaconLabel: String?
	let errorScreen: String?
	let targets: [ChaosTarget]
	let textFields: [ChaosTarget]
	/// Enough of the screen to tell whether Back changed anything.
	let signature: String
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

		func visit(_ node: XCUIElementSnapshot) {
			let id = node.identifier
			if id == TestIdentifiers.Chaos.beacon {
				beacon = node.label
				return
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
			let onScreen = frame.width >= 2 && frame.height >= 2 && screen.intersects(frame)
			// An `.other` with no identifier is layout, not something to press.
			let pressable = Self.actionable.contains(node.elementType)
				&& (node.elementType != .other || !id.isEmpty)
			if onScreen && pressable && node.isEnabled {
				let target = ChaosTarget(identifier: id, label: node.label, type: node.elementType, frame: frame)
				targets.append(target)
				if node.elementType == .textField || node.elementType == .searchField {
					fields.append(target)
				}
			}
			node.children.forEach(visit)
		}
		visit(snapshot)

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
				signature: signatureParts.joined(separator: "|")))
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
