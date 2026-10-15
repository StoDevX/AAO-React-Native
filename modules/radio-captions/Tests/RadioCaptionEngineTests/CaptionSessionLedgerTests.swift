import Testing
@testable import RadioCaptionEngine

struct CaptionSessionLedgerTests {
	@Test func aStartWithNothingStoppedMayRun() {
		let ledger = CaptionSessionLedger<String>()
		#expect(ledger.mayStart(id: 1))
	}

	@Test func stopBeforeTheStartBodyRunsCancelsThatStart() {
		var ledger = CaptionSessionLedger<String>()
		#expect(ledger.stop(through: 1) == nil)
		#expect(!ledger.mayStart(id: 1))
		let begun = ledger.begin(id: 1, session: "one")
		#expect(!begun.installed)
		#expect(begun.previous == nil)
		#expect(!ledger.isCurrent(id: 1))
	}

	@Test func stopAfterTheStartHandsBackTheSessionToEnd() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.begin(id: 1, session: "one")
		#expect(ledger.isCurrent(id: 1))
		#expect(ledger.stop(through: 1) == "one")
		#expect(!ledger.isCurrent(id: 1))
		#expect(ledger.stop(through: 1) == nil)
	}

	@Test func aNewerStartAfterAStopIsUntouched() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.stop(through: 1)
		#expect(ledger.mayStart(id: 2))
		let begun = ledger.begin(id: 2, session: "two")
		#expect(begun.installed)
		#expect(ledger.isCurrent(id: 2))
	}

	@Test func aStopDoesNotEndASessionNewerThanIt() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.begin(id: 2, session: "two")
		#expect(ledger.stop(through: 1) == nil)
		#expect(ledger.isCurrent(id: 2))
	}

	@Test func aStopTakesTheHighestIdItHasSeen() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.stop(through: 3)
		_ = ledger.stop(through: 1)
		#expect(!ledger.mayStart(id: 3))
		#expect(ledger.mayStart(id: 4))
	}

	@Test func aNewStartHandsBackThePreviousSessionToEnd() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.begin(id: 1, session: "one")
		let begun = ledger.begin(id: 2, session: "two")
		#expect(begun.installed)
		#expect(begun.previous == "one")
		#expect(ledger.isCurrent(id: 2))
		#expect(!ledger.isCurrent(id: 1))
	}

	@Test func anOlderStartRunningLateDoesNotReplaceANewerOne() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.begin(id: 2, session: "two")
		let begun = ledger.begin(id: 1, session: "one")
		#expect(!begun.installed)
		#expect(begun.previous == nil)
		#expect(ledger.isCurrent(id: 2))
	}

	@Test func stoppingEverythingEndsTheSessionAndRefusesLaterStarts() {
		var ledger = CaptionSessionLedger<String>()
		_ = ledger.begin(id: 5, session: "five")
		#expect(ledger.stopAll() == "five")
		#expect(!ledger.mayStart(id: 6))
	}
}
