import XCTest

/// Which targets the accessibility warnings call out: controls the app draws,
/// not the system's own or the layout around them.
final class ChaosTargetCheckTests: XCTestCase {
	private func target(
		_ type: XCUIElement.ElementType, id: String = "", label: String = "", width: CGFloat = 60, height: CGFloat = 60,
		inBar: Bool = false
	) -> ChaosTarget {
		ChaosTarget(
			identifier: id, label: label, type: type, frame: CGRect(x: 10, y: 10, width: width, height: height), inBar: inBar)
	}

	private func warnings(_ targets: [ChaosTarget]) -> [String] {
		let observation = ChaosObservation(
			beaconLabel: nil, errorScreen: nil, targets: targets, textFields: [], signature: "", sheet: nil, grabber: nil,
			title: "Screen")
		return targetWarnings(observation).map(\.warning)
	}

	func testWarnsOfAButtonWithNoLabel() {
		XCTAssertEqual(warnings([target(.button, id: "star")]), ["unlabelled: id:star 60×60 on \"Screen\""])
	}

	func testLeavesCellsAndLayoutToTheirChildren() {
		// A cell's text sits in its children, which VoiceOver reads; an `.other`
		// with an identifier is layout the oracle counts as pressable.
		XCTAssertEqual(warnings([target(.cell), target(.other, id: "home-tile-grid")]), [])
	}

	func testLeavesTheBackButtonToTheSystem() {
		XCTAssertEqual(warnings([target(.button, id: TestIdentifiers.Navigation.backButton, width: 43, height: 43)]), [])
	}

	func testWarnsOfASmallControl() {
		XCTAssertEqual(
			warnings([target(.button, label: "Star", width: 20, height: 20)]), ["small target: label:Star 20×20 on \"Screen\""])
	}

	func testWarnsOfAShortRow() {
		XCTAssertEqual(
			warnings([target(.cell, label: "Stav", width: 355, height: 38)]), ["small target: label:Stav 355×38 on \"Screen\""])
	}

	func testLeavesBarItemsTheGrabberAndSwitchesToTheSystem() {
		XCTAssertEqual(
			warnings([
				target(.button, label: "Customize", width: 36, height: 36, inBar: true),
				target(.button, label: TestIdentifiers.Navigation.sheetGrabber, width: 96, height: 23),
				target(.switch, label: "Dark Mode", width: 51, height: 31),
				target(.textField, label: "Search", width: 300, height: 36),
			]), [])
	}
}
