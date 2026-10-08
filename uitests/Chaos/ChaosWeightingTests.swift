import XCTest

/// The monkey's weighted pick: favours what it has used least, and draws the
/// same from the generator whatever it is given, so a seed repeats.
/// Tags: chaos
final class ChaosWeightingTests: XCTestCase {
	func testDrawsOnceEvenWithNothingToPick() {
		var picked = ChaosRandom(seed: 1)
		var reference = ChaosRandom(seed: 1)
		XCTAssertNil(pickWeighted([Int](), uses: { _ in 0 }, using: &picked))
		_ = Double.random(in: 0..<1, using: &reference)
		XCTAssertEqual(picked.next(), reference.next(), "an empty pick should draw exactly once")
	}

	func testDrawsOnceWithItems() {
		var picked = ChaosRandom(seed: 2)
		var reference = ChaosRandom(seed: 2)
		_ = pickWeighted([1, 2, 3], uses: { _ in 0 }, using: &picked)
		_ = Double.random(in: 0..<1, using: &reference)
		XCTAssertEqual(picked.next(), reference.next())
	}

	func testIsTheSameForTheSameSeedAndCounts() {
		var a = ChaosRandom(seed: 3)
		var b = ChaosRandom(seed: 3)
		let uses = ["a": 4, "b": 0, "c": 1]
		for _ in 0..<100 {
			XCTAssertEqual(
				pickWeighted(["a", "b", "c"], uses: { uses[$0]! }, using: &a),
				pickWeighted(["a", "b", "c"], uses: { uses[$0]! }, using: &b))
		}
	}

	func testFavoursWhatHasBeenUsedLeast() {
		var random = ChaosRandom(seed: 4)
		var counts = ["fresh": 0, "worn": 0]
		for _ in 0..<10_000 {
			let item = pickWeighted(["fresh", "worn"], uses: { $0 == "worn" ? 9 : 0 }, using: &random)!
			counts[item]! += 1
		}
		// Weights 1 and 1/10: fresh should win about 10 times in 11.
		XCTAssertEqual(Double(counts["fresh"]!) / 10_000, 10.0 / 11.0, accuracy: 0.02)
	}

	func testStillPicksWhatHasBeenUsed() {
		var random = ChaosRandom(seed: 5)
		XCTAssertEqual(pickWeighted(["only"], uses: { _ in 50 }, using: &random), "only")
	}

	func testKeysATargetByIdentifierThenLabelThenTypeAndPlace() {
		let frame = CGRect(x: 103, y: 207, width: 44, height: 44)
		XCTAssertEqual(targetKey(ChaosTarget(identifier: "row", label: "Stav", type: .cell, frame: frame)), "id:row")
		XCTAssertEqual(targetKey(ChaosTarget(identifier: "", label: "Stav", type: .cell, frame: frame)), "label:Stav")
		XCTAssertEqual(
			targetKey(ChaosTarget(identifier: "", label: "", type: .button, frame: frame)),
			"\(XCUIElement.ElementType.button.rawValue)@100,200")
	}
}
