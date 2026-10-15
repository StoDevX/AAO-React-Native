import Testing
@testable import RadioCaptionEngine

struct CaptionEventCoalescerTests {
	/// A clock the test moves by hand.
	final class Clock {
		var seconds = 100.0
	}

	private func volatile(_ text: String) -> EngineEvent {
		.caption(CaptionUpdate(text: text, isFinal: false, startSeconds: 0))
	}

	private func final(_ text: String) -> EngineEvent {
		.caption(CaptionUpdate(text: text, isFinal: true, startSeconds: 0))
	}

	private func make(_ clock: Clock) -> CaptionEventCoalescer {
		CaptionEventCoalescer(interval: 0.1, now: { clock.seconds })
	}

	@Test func firstVolatilePassesAtOnce() {
		let clock = Clock()
		var coalescer = make(clock)
		#expect(coalescer.accept(volatile("hello")) == [volatile("hello")])
	}

	@Test func volatilesWithinTheIntervalCollapseToTheLatest() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.03
		#expect(coalescer.accept(volatile("ab")) == [])
		clock.seconds += 0.03
		#expect(coalescer.accept(volatile("abc")) == [])
		#expect(coalescer.takeDue() == nil)
		clock.seconds += 0.05
		#expect(coalescer.takeDue() == volatile("abc"))
		#expect(coalescer.takeDue() == nil)
	}

	@Test func pendingVolatileReportsHowLongUntilItIsDue() throws {
		let clock = Clock()
		var coalescer = make(clock)
		#expect(coalescer.dueIn == nil)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.04
		_ = coalescer.accept(volatile("ab"))
		let wait = try #require(coalescer.dueIn)
		#expect(abs(wait - 0.06) < 0.0001)
	}

	@Test func volatileAfterTheIntervalPassesAtOnce() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.11
		#expect(coalescer.accept(volatile("ab")) == [volatile("ab")])
	}

	@Test func finalDropsPendingVolatileAndPassesAtOnce() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.02
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.accept(final("abc")) == [final("abc")])
		clock.seconds += 1
		#expect(coalescer.takeDue() == nil)
		#expect(coalescer.dueIn == nil)
	}

	@Test func stateEventPassesAtOnceWithoutDisturbingPendingVolatile() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.02
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.accept(.state(.music)) == [.state(.music)])
		clock.seconds += 0.1
		#expect(coalescer.takeDue() == volatile("ab"))
	}
}
