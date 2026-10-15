import Testing
@testable import RadioCaptionEngine

/// The clock and interval are binary fractions, so the sums below are exact and a boundary
/// test lands on the boundary.
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
		CaptionEventCoalescer(interval: 0.25, now: { clock.seconds })
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
		clock.seconds += 0.0625
		#expect(coalescer.accept(volatile("ab")) == [])
		clock.seconds += 0.0625
		#expect(coalescer.accept(volatile("abc")) == [])
		#expect(coalescer.takeDue() == nil)
		clock.seconds += 0.125
		#expect(coalescer.takeDue() == volatile("abc"))
		#expect(coalescer.takeDue() == nil)
	}

	@Test func pendingVolatileReportsHowLongUntilItIsDue() throws {
		let clock = Clock()
		var coalescer = make(clock)
		#expect(coalescer.dueIn == nil)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.125
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.dueIn == 0.125)
	}

	@Test func volatileAtExactlyTheIntervalPasses() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.25
		#expect(coalescer.accept(volatile("ab")) == [volatile("ab")])
	}

	@Test func volatileJustUnderTheIntervalWaits() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.234375
		#expect(coalescer.accept(volatile("ab")) == [])
	}

	@Test func pendingVolatileIsDueAtExactlyTheInterval() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.125
		_ = coalescer.accept(volatile("ab"))
		clock.seconds += 0.109375
		#expect(coalescer.takeDue() == nil)
		clock.seconds += 0.015625
		#expect(coalescer.takeDue() == volatile("ab"))
	}

	@Test func finalDropsPendingVolatileAndPassesAtOnce() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.0625
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.accept(final("abc")) == [final("abc")])
		clock.seconds += 1
		#expect(coalescer.takeDue() == nil)
		#expect(coalescer.dueIn == nil)
	}

	@Test func finalDoesNotRestartTheVolatileInterval() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.125
		_ = coalescer.accept(final("a"))
		clock.seconds += 0.125
		// The first volatile went out 0.25 s ago, whatever has happened since.
		#expect(coalescer.accept(volatile("b")) == [volatile("b")])
	}

	@Test func captioningStatePassesAtOnceWithoutDisturbingPendingVolatile() {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.0625
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.accept(.state(.captioning)) == [.state(.captioning)])
		clock.seconds += 0.25
		#expect(coalescer.takeDue() == volatile("ab"))
	}

	@Test(arguments: [
		EngineState.music, .reconnecting, .downloading, .unavailable("gone"),
	])
	func otherStatesPassAtOnceAndDropPendingVolatile(state: EngineState) {
		let clock = Clock()
		var coalescer = make(clock)
		_ = coalescer.accept(volatile("a"))
		clock.seconds += 0.0625
		_ = coalescer.accept(volatile("ab"))
		#expect(coalescer.accept(.state(state)) == [.state(state)])
		clock.seconds += 1
		#expect(coalescer.takeDue() == nil)
		#expect(coalescer.dueIn == nil)
	}
}
