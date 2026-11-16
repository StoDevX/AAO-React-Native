import XCTest

/// How `waitUntil` spaces its checks: the first after 0.2s, each later one
/// half again as long as the last, and none more than 1s apart.
///
/// XCTest's own waits check about once a second, so a wait for something
/// that turns up a moment later overshoots by up to a second. The backoff
/// keeps the quick checks for a condition that is about to hold, and slows
/// down for one that is not.
private enum Polling {
    static let firstInterval: TimeInterval = 0.2
    static let growth = 1.5
    static let longestInterval: TimeInterval = 1.0
}

/// Waits up to `timeout` seconds for `condition` to hold, and says whether it
/// did. The step shows in the test report as `activity`.
///
/// Checks once before waiting at all, so a condition that already holds
/// costs one check, then as `Polling` spaces them, with a last check at the
/// deadline. Spins the run loop between checks, as XCTest's waits do.
@MainActor
func waitUntil(_ activity: String, timeout: TimeInterval, _ condition: () -> Bool) -> Bool {
    XCTContext.runActivity(named: activity) { _ in
        if condition() { return true }
        let deadline = Date().addingTimeInterval(timeout)
        var interval = Polling.firstInterval
        while true {
            let remaining = deadline.timeIntervalSinceNow
            if remaining <= 0 { return false }
            RunLoop.current.run(until: Date().addingTimeInterval(min(interval, remaining)))
            if condition() { return true }
            interval = min(interval * Polling.growth, Polling.longestInterval)
        }
    }
}

extension XCUIElement {
    /// `waitForExistence(timeout:)`, checking as `waitUntil` does.
    @MainActor
    func waitUntilExists(timeout: TimeInterval) -> Bool {
        waitUntil("Waiting \(timeout)s for \(self) to exist", timeout: timeout) { exists }
    }
}
