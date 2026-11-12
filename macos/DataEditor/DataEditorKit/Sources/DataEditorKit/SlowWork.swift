import Observation

/// Work that holds the editor still, shown only once it has run long enough to
/// notice: greying the controls for an edit that answers in a few frames makes
/// the whole editor flash.
@MainActor @Observable
public final class SlowWork {
    /// Whether work is running; what it guards waits until it ends.
    public private(set) var isRunning = false
    /// Whether the running work has outlasted the delay.
    public private(set) var isShown = false
    private let delay: Duration

    public init(delay: Duration) { self.delay = delay }

    public func run<T, Failure: Error>(_ work: () async throws(Failure) -> T) async throws(Failure) -> T {
        isRunning = true
        let reveal = Task { [delay] in
            try? await Task.sleep(for: delay)
            if !Task.isCancelled { isShown = true }
        }
        defer {
            reveal.cancel()
            isRunning = false
            isShown = false
        }
        return try await work()
    }
}
