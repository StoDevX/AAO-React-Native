import Testing
@testable import DataEditorKit

private actor Runs {
    var values: [Int] = []
    func add(_ value: Int) { values.append(value) }
}

struct DebouncerTests {
    @Test func runsOnlyTheLastOfARapidBurst() async throws {
        let debouncer = Debouncer(delay: .milliseconds(50))
        let runs = Runs()
        for value in 1...10 {
            await debouncer.schedule { await runs.add(value) }
            try await Task.sleep(for: .milliseconds(5))
        }
        try await Task.sleep(for: .milliseconds(200))
        #expect(await runs.values == [10])
    }

    @Test func runsAgainAfterAPause() async throws {
        let debouncer = Debouncer(delay: .milliseconds(20))
        let runs = Runs()
        await debouncer.schedule { await runs.add(1) }
        try await Task.sleep(for: .milliseconds(100))
        await debouncer.schedule { await runs.add(2) }
        try await Task.sleep(for: .milliseconds(100))
        #expect(await runs.values == [1, 2])
    }
}
