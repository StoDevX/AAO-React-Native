import XCTest

/// A session's choices: what it does, how often, and what it types.
/// Tags: chaos
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

	func testWarnsOfASpinnerLeftAfterTheNetworkCameBack() {
		var watch = ChaosSpinnerWatch()
		let start = Date()
		XCTAssertNil(watch.observe(network: "offline", hasSpinner: true, title: "Menus", at: start))
		XCTAssertNil(watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(1)))
		XCTAssertNil(watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(20)))
		XCTAssertEqual(
			watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(22)),
			"stuck spinner: Menus")
		XCTAssertNil(watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(40)))
	}

	func testIgnoresASpinnerThatGoesAwayOrNeverHadAnOutage() {
		var watch = ChaosSpinnerWatch()
		let start = Date()
		XCTAssertNil(watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(60)))
		_ = watch.observe(network: "offline", hasSpinner: false, title: "Menus", at: start)
		_ = watch.observe(network: "online", hasSpinner: true, title: "Menus", at: start.addingTimeInterval(1))
		XCTAssertNil(watch.observe(network: "online", hasSpinner: false, title: "Menus", at: start.addingTimeInterval(30)))
	}

	func testIsStuckAfterFortyStepsWithoutANewScreen() {
		var novelty = ChaosNovelty()
		novelty.see("Home")
		for _ in 0..<39 { novelty.see("Home") }
		XCTAssertFalse(novelty.isStuck)
		novelty.see("Home")
		XCTAssertTrue(novelty.isStuck)
		novelty.moved()
		XCTAssertFalse(novelty.isStuck)
		novelty.see("Menus")
		for _ in 0..<39 { novelty.see("Home") }
		XCTAssertFalse(novelty.isStuck, "a new title resets the count")
	}

	func testTeleportsOnlyToScreensThatNeedNothingPassedIn() {
		XCTAssertEqual(
			teleportRoutes(["menus", "calendar/event", "directory/[id]", "menu-item-detail", "transit", "hours/detail/report"]),
			["menus", "transit"])
		XCTAssertFalse(teleportRoutes(ChaosRoutes.all).isEmpty)
	}
}
