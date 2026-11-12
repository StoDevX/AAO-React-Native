import Foundation

/// Runs only the last of a burst of work, once `delay` has passed with nothing newer.
public actor Debouncer {
    private let delay: Duration
    private var task: Task<Void, Never>?

    public init(delay: Duration) { self.delay = delay }

    public func schedule(_ work: @escaping @Sendable () async -> Void) {
        task?.cancel()
        task = Task { [delay] in
            try? await Task.sleep(for: delay)
            guard !Task.isCancelled else { return }
            await work()
        }
    }
}
