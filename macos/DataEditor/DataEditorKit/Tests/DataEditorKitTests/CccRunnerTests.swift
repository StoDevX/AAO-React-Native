import Foundation
import Testing
@testable import DataEditorKit

/// The real pid file lives under Application Support, so the folder name has a space.
private func temporaryPidFile() -> URL {
    let folder = FileManager.default.temporaryDirectory.appending(path: "ccc state \(UUID().uuidString)")
    try! FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    return folder.appending(path: "ccc.pid")
}

func fixture(_ name: String, pidFile: URL = temporaryPidFile()) -> CccRunner.Configuration {
    let script = Bundle.module.url(forResource: name, withExtension: "sh", subdirectory: "Fixtures")!
    return CccRunner.Configuration(
        executable: URL(filePath: "/bin/sh"),
        arguments: [script.path],
        workingDirectory: FileManager.default.temporaryDirectory,
        environment: ["PAGES_ORIGIN_OVERRIDE": "http://editor-mac.local:8790/"],
        pidFile: pidFile
    )
}

/// The process id a fixture logged as `grandchild <pid>`.
private func grandchild(of runner: CccRunner) async -> pid_t? {
    for _ in 0..<100 {
        if let line = await runner.log.first(where: { $0.hasPrefix("grandchild ") }) { return pid_t(line.dropFirst("grandchild ".count)) }
        try? await Task.sleep(for: .milliseconds(50))
    }
    return nil
}

/// Whether `pid` (or, negative, a process group) is gone within two seconds.
private func isGone(_ pid: pid_t) async -> Bool {
    for _ in 0..<100 {
        if kill(pid, 0) != 0 { return true }
        try? await Task.sleep(for: .milliseconds(20))
    }
    return false
}

/// The process group a pid file names.
private func group(in pidFile: URL) -> pid_t? {
    (try? String(contentsOf: pidFile, encoding: .utf8))?.split(separator: " ").first.flatMap { pid_t($0) }
}

func waitFor(_ runner: CccRunner, _ wanted: CccRunner.Status) async -> Bool {
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

    @Test func stopKillsWhatTheWorkerStarted() async throws {
        let runner = CccRunner(
            configuration: fixture("ccc with grandchild"), restartLimit: 3, ready: { true }, stopGracePeriod: .milliseconds(300)
        )
        await runner.start()
        #expect(await waitFor(runner, .running))
        let child = try #require(await grandchild(of: runner))
        await runner.stop()
        #expect(await isGone(child))
    }

    @Test func killsAGroupLeftRunningBeforeStarting() async throws {
        let pidFile = temporaryPidFile()
        // a runner whose app went away without stopping it
        let leftover = CccRunner(configuration: fixture("ccc with grandchild", pidFile: pidFile), restartLimit: 0, ready: { true })
        await leftover.start()
        #expect(await waitFor(leftover, .running))
        let child = try #require(await grandchild(of: leftover))
        let leftoverGroup = try #require(group(in: pidFile))
        let runner = CccRunner(configuration: fixture("ccc-ok", pidFile: pidFile), restartLimit: 3, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        #expect(await isGone(-leftoverGroup))
        #expect(await isGone(child))
        await runner.stop()
        #expect(!FileManager.default.fileExists(atPath: pidFile.path))
    }

    @Test func leavesAGroupWhoseLeaderStartedAtAnotherTime() async throws {
        let otherPidFile = temporaryPidFile()
        let other = CccRunner(configuration: fixture("ccc-ok", pidFile: otherPidFile), restartLimit: 3, ready: { true })
        await other.start()
        #expect(await waitFor(other, .running))
        let otherGroup = try #require(group(in: otherPidFile))
        // the id a crashed app wrote, since reused by a group that is not ccc's
        let pidFile = temporaryPidFile()
        try Data("\(otherGroup) 1.0".utf8).write(to: pidFile)
        let runner = CccRunner(configuration: fixture("ccc-ok", pidFile: pidFile), restartLimit: 3, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        // a killed runner would restart, logging its line again
        try await Task.sleep(for: .milliseconds(300))
        #expect(await other.log.filter { $0.hasPrefix("PAGES_ORIGIN_OVERRIDE=") }.count == 1)
        await runner.stop()
        await other.stop()
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
        #expect(configuration.pidFile == URL(filePath: "/Application Support/ccc/ccc.pid"))
        // the dev script runs wrangler's `#!/usr/bin/env node`
        #expect(configuration.environment["PATH"]?.hasPrefix("/App Bundle/Runtime:") == true)
    }

    @Test func pagesOriginUsesTheBonjourName() {
        #expect(pagesOrigin(localHostName: "Hawkens-MacBook-Pro", port: 8790) == "http://Hawkens-MacBook-Pro.local:8790/")
    }
}
