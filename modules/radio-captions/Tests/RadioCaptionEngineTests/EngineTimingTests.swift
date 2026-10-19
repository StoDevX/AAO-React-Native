import XCTest
@testable import RadioCaptionEngine

final class EngineTimingTests: XCTestCase {
	func testTimelineStartsAtTheRunsOwnTime() {
		var timeline = EngineTimeline()
		timeline.beginRun()
		XCTAssertEqual(timeline.time(forRunSeconds: 0), 0)
		XCTAssertEqual(timeline.time(forRunSeconds: 12.5), 12.5)
	}

	func testNextRunContinuesWhereTheLastBufferEnded() {
		var timeline = EngineTimeline()
		timeline.beginRun()
		timeline.delivered(startSeconds: 0, duration: 0.5)
		timeline.delivered(startSeconds: 0.5, duration: 0.5)
		timeline.beginRun()
		XCTAssertEqual(timeline.time(forRunSeconds: 0), 1.0)
		timeline.delivered(startSeconds: 0, duration: 2)
		timeline.beginRun()
		XCTAssertEqual(timeline.time(forRunSeconds: 0.25), 3.25)
	}

	func testARunThatDeliveredNothingLeavesTheTimelineWhereItWas() {
		var timeline = EngineTimeline()
		timeline.beginRun()
		timeline.delivered(startSeconds: 0, duration: 4)
		timeline.beginRun()
		timeline.beginRun()
		XCTAssertEqual(timeline.time(forRunSeconds: 0), 4)
	}

	func testBackoffDoublesToTheCapAndResets() {
		var backoff = Backoff(first: .seconds(2), longest: .seconds(30))
		let delays = (0..<6).map { _ in backoff.next() }
		XCTAssertEqual(delays, [.seconds(2), .seconds(4), .seconds(8), .seconds(16), .seconds(30), .seconds(30)])
		backoff.reset()
		XCTAssertEqual(backoff.next(), .seconds(2))
	}

	func testStallDetectorTripsOnlyAfterTheTimeoutWithoutAudio() {
		let start = ContinuousClock.now
		var detector = StallDetector(timeout: .seconds(10), since: start)
		XCTAssertFalse(detector.isStalled(at: start + .seconds(9)))
		XCTAssertTrue(detector.isStalled(at: start + .seconds(11)))
		detector.heardAudio(at: start + .seconds(11))
		XCTAssertFalse(detector.isStalled(at: start + .seconds(20)))
		XCTAssertTrue(detector.isStalled(at: start + .seconds(22)))
	}
}
