import Testing
@testable import DataEditorKit

@MainActor
struct SlowWorkTests {
    /// Most edits answer well inside the delay; greying the editor for each would make it flash.
    @Test func neverShowsWorkThatFinishesInTime() async throws {
        let work = SlowWork(delay: .milliseconds(200))
        let shownWhileRunning = await work.run { work.isShown }
        #expect(!shownWhileRunning)
        #expect(!work.isRunning)
        // nor once the delay has passed
        try await Task.sleep(for: .milliseconds(400))
        #expect(!work.isShown)
    }

    @Test func showsWorkThatOutlastsTheDelayUntilItEnds() async throws {
        let work = SlowWork(delay: .milliseconds(20))
        let (ended, end) = AsyncStream.makeStream(of: Void.self)
        let running = Task { await work.run { for await _ in ended {} } }
        let deadline = ContinuousClock.now + .seconds(10)
        while !work.isShown, ContinuousClock.now < deadline { try await Task.sleep(for: .milliseconds(10)) }
        #expect(work.isShown)
        #expect(work.isRunning)
        end.finish()
        await running.value
        #expect(!work.isShown)
        #expect(!work.isRunning)
    }
}
