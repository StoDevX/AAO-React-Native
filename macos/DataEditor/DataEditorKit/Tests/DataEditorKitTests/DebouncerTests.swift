import Testing
@testable import DataEditorKit

private actor Runs {
    var values: [Int] = []
    func add(_ value: Int) { values.append(value) }
}

/// Waits for `runs` to hold `count` values, for as long as a busy machine may take.
private func values(of runs: Runs, count: Int) async throws -> [Int] {
    let deadline = ContinuousClock.now + .seconds(10)
    while await runs.values.count < count, ContinuousClock.now < deadline {
        try await Task.sleep(for: .milliseconds(10))
    }
    return await runs.values
}

// These wait on what ran rather than sleeping a set time: a runner busy with
// the other suites can wake a sleep long after it was due.
struct DebouncerTests {
    @Test func runsOnlyTheLastOfARapidBurst() async throws {
        // far longer than the burst takes, so none of it runs early
        let debouncer = Debouncer(delay: .milliseconds(500))
        let runs = Runs()
        for value in 1...10 {
            await debouncer.schedule { await runs.add(value) }
        }
        #expect(try await values(of: runs, count: 1) == [10])
        // and nothing earlier in the burst follows it
        try await Task.sleep(for: .milliseconds(600))
        #expect(await runs.values == [10])
    }

    @Test func runsAgainAfterAPause() async throws {
        let debouncer = Debouncer(delay: .milliseconds(20))
        let runs = Runs()
        await debouncer.schedule { await runs.add(1) }
        #expect(try await values(of: runs, count: 1) == [1])
        await debouncer.schedule { await runs.add(2) }
        #expect(try await values(of: runs, count: 2) == [1, 2])
    }
}
