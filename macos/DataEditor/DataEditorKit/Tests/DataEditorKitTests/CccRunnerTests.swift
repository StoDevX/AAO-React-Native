import Foundation
import Testing
@testable import DataEditorKit

private func fixture(_ name: String) -> CccRunner.Configuration {
    let script = Bundle.module.url(forResource: name, withExtension: "sh", subdirectory: "Fixtures")!
    return CccRunner.Configuration(
        executable: URL(filePath: "/bin/sh"),
        arguments: [script.path],
        workingDirectory: FileManager.default.temporaryDirectory,
        environment: ["PAGES_ORIGIN_OVERRIDE": "http://editor-mac.local:8790/"]
    )
}

private func waitFor(_ runner: CccRunner, _ wanted: CccRunner.Status) async -> Bool {
    for await status in await runner.statuses() where status == wanted { return true }
    return false
}

/// The log fills from a reader task, so a line can arrive after the status that follows it.
private func waitForLog(_ runner: CccRunner, _ line: String) async -> Bool {
    for _ in 0..<100 {
        if await runner.log.contains(line) { return true }
        try? await Task.sleep(for: .milliseconds(50))
    }
    return false
}

@Suite(.timeLimit(.minutes(1)))
struct CccRunnerTests {
    @Test func reportsAPortInUse() async {
        let runner = CccRunner(configuration: fixture("ccc-port-in-use"), restartLimit: 3, ready: { false })
        await runner.start()
        #expect(await waitFor(runner, .portInUse))
    }

    @Test func givesUpAfterRepeatedCrashes() async {
        let runner = CccRunner(configuration: fixture("ccc-crash"), restartLimit: 2, ready: { false })
        await runner.start()
        #expect(await waitFor(runner, .crashed(3)))
        #expect(await runner.log.filter { $0 == "starting" }.count == 3)
    }

    @Test func isRunningOnceTheWorkerAnswers() async {
        let runner = CccRunner(configuration: fixture("ccc-ok"), restartLimit: 3, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        #expect(await waitForLog(runner, "PAGES_ORIGIN_OVERRIDE=http://editor-mac.local:8790/"))
        await runner.stop()
        #expect(await waitFor(runner, .stopped))
    }

    @Test func startingTwiceLaunchesOnce() async {
        let runner = CccRunner(configuration: fixture("ccc-ok"), restartLimit: 3, ready: { true })
        await runner.start()
        await runner.start()
        #expect(await waitFor(runner, .running))
        #expect(await waitForLog(runner, "PAGES_ORIGIN_OVERRIDE=http://editor-mac.local:8790/"))
        try? await Task.sleep(for: .milliseconds(300))
        #expect(await runner.log.filter { $0.hasPrefix("PAGES_ORIGIN_OVERRIDE=") }.count == 1)
        await runner.stop()
    }

    @Test func startingAfterStoppingLeavesOneProcess() async {
        let runner = CccRunner(configuration: fixture("ccc-ok"), restartLimit: 3, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        // the process must have written its line before it is stopped
        #expect(await waitForLog(runner, "PAGES_ORIGIN_OVERRIDE=http://editor-mac.local:8790/"))
        await runner.stop()
        await runner.start()
        #expect(await waitFor(runner, .running))
        for _ in 0..<100 where await runner.log.filter({ $0.hasPrefix("PAGES_ORIGIN_OVERRIDE=") }).count < 2 {
            try? await Task.sleep(for: .milliseconds(50))
        }
        // the first process's exit must not disturb the second
        try? await Task.sleep(for: .milliseconds(500))
        #expect(await runner.log.filter { $0.hasPrefix("PAGES_ORIGIN_OVERRIDE=") }.count == 2)
        await runner.stop()
        #expect(await waitFor(runner, .stopped))
    }

    @Test func aWorkerThatRanForAWhileGetsFreshRestarts() async {
        let runner = CccRunner(configuration: fixture("ccc-flaky"), restartLimit: 1, ready: { true })
        await runner.start()
        // without a reset, a limit of 1 gives up after the second launch
        for _ in 0..<100 where await runner.log.filter({ $0 == "flaky" }).count < 4 {
            try? await Task.sleep(for: .milliseconds(100))
        }
        #expect(await runner.log.filter { $0 == "flaky" }.count >= 4)
        #expect(await runner.status != .crashed(2))
        await runner.stop()
    }

    @Test func stopKillsAWorkerThatIgnoresTerminate() async {
        let runner = CccRunner(
            configuration: fixture("ccc-ignores-term"), restartLimit: 3, ready: { true }, stopGracePeriod: .milliseconds(300)
        )
        await runner.start()
        #expect(await waitFor(runner, .running))
        #expect(await waitForLog(runner, "ignoring TERM"))
        await runner.stop()
        #expect(await runner.status == .stopped)
    }

    @Test func givesUpOnAWorkerThatNeverAnswers() async {
        let runner = CccRunner(
            configuration: fixture("ccc-ok"), restartLimit: 0, ready: { false },
            readinessAttempts: 3, readinessInterval: .milliseconds(50)
        )
        await runner.start()
        // SIGTERM, since the runner ended the process itself
        #expect(await waitFor(runner, .crashed(15)))
        #expect(await runner.log.contains("ccc did not answer in time"))
    }

    @Test func bundledConfigurationRunsTheDevScript() {
        let configuration = CccRunner.Configuration.bundled(
            node: URL(filePath: "/App Bundle/Runtime/node"),
            cccRoot: URL(filePath: "/App Bundle/Runtime/ccc"),
            pagesOrigin: "http://editor-mac.local:8790/",
            state: URL(filePath: "/Application Support/ccc")
        )
        #expect(configuration.arguments == ["source/dev/index.ts"])
        #expect(configuration.environment["PAGES_ORIGIN_OVERRIDE"] == "http://editor-mac.local:8790/")
        #expect(configuration.environment["CCC_PERSIST_TO"] == "/Application Support/ccc/wrangler-state")
        // the dev script runs wrangler's `#!/usr/bin/env node`
        #expect(configuration.environment["PATH"]?.hasPrefix("/App Bundle/Runtime:") == true)
    }

    @Test func pagesOriginUsesTheBonjourName() {
        #expect(pagesOrigin(localHostName: "Hawkens-MacBook-Pro", port: 8790) == "http://Hawkens-MacBook-Pro.local:8790/")
    }
}
