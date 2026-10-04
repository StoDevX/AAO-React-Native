import XCTest

/// A session's choices: what it does, how often, and what it types.
final class ChaosSessionTests: XCTestCase {
	func testEachProfileWeighsToAHundred() {
		for profile in [ChaosProfile.fuzz, .session] {
			for rotate in [false, true] {
				XCTAssertEqual(ChaosAction.allCases.map { $0.weight(in: profile, rotate: rotate) }.reduce(0, +), 100)
			}
		}
	}

	func testFuzzingKeepsItsWeights() {
		let weights = Dictionary(uniqueKeysWithValues: ChaosAction.allCases.map { ($0, $0.weight(in: .fuzz, rotate: false)) })
		XCTAssertEqual(
			weights,
			[.tap: 55, .scroll: 15, .type: 8, .back: 10, .openRoute: 7, .background: 3, .rotate: 2, .kill: 0, .teleport: 0])
	}

	func testASessionNeverOpensARouteOrTeleportsByChance() {
		var random = ChaosRandom(seed: 1)
		for _ in 0..<10_000 {
			let action = ChaosAction.pick(in: .session, rotate: false, using: &random)
			XCTAssertNotEqual(action, .openRoute)
			XCTAssertNotEqual(action, .teleport)
			XCTAssertNotEqual(action, .rotate)
		}
	}

	func testTypesAWordWholeOrAPrefixOfIt() {
		XCTAssertEqual(sessionText(vocab: ["Regents", "Stav Hall"], choice: 1, fraction: 0.2), "Stav Hall")
		XCTAssertEqual(sessionText(vocab: ["Regents"], choice: 0, fraction: 0.5), "Re")
		XCTAssertEqual(sessionText(vocab: ["Regents"], choice: 0, fraction: 0.99), "Regent")
	}

	func testFallsBackToTheFuzzingStringsWithNoWords() {
		XCTAssertEqual(sessionText(vocab: [], choice: 1, fraction: 0), chaosStrings[1])
	}
}
