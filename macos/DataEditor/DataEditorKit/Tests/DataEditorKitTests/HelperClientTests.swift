import Foundation
import Testing
@testable import DataEditorKit

/// Runs `body` against the fake helper, then closes its input. A helper left
/// running keeps the test process's stderr pipe open, so `swift test` never exits.
private func withFakeHelper(_ body: (HelperClient) async throws -> Void) async throws {
    let script = Bundle.module.url(forResource: "fake-helper", withExtension: "sh", subdirectory: "Fixtures")!
    let client = try HelperClient(executable: URL(filePath: "/bin/sh"), arguments: [script.path])
    await client.start()
    do { try await body(client) } catch {
        await client.stop()
        throw error
    }
    await client.stop()
}

private struct Echo: Decodable, Sendable { let echo: JSONValue }

struct HelperClientTests {
    @Test func returnsTheResultForItsRequest() async throws {
        try await withFakeHelper { client in
            let reply: Echo = try await client.call("load", ["file": "building-hours/1-1-cage.yaml"])
            #expect(reply.echo["method"] == .string("load"))
            #expect(reply.echo["params"]?["file"] == .string("building-hours/1-1-cage.yaml"))
        }
    }

    @Test func throwsTheHelpersError() async throws {
        try await withFakeHelper { client in
            await #expect(throws: HelperClient.Failure(message: "it failed")) {
                let _: Echo = try await client.call("fail", [String: String]())
            }
        }
    }

    @Test func describesAFailureByTheHelpersMessage() {
        #expect(HelperClient.Failure(message: "x is outside the workspace").localizedDescription == "x is outside the workspace")
        // the helper's own refusal is not its death
        #expect(!HelperClient.Failure(message: "x is outside the workspace").helperStopped)
    }

    @Test func matchesConcurrentRepliesToTheirRequests() async throws {
        try await withFakeHelper { client in
            async let a: Echo = client.call("a", [String: String]())
            async let b: Echo = client.call("b", [String: String]())
            let (first, second) = try await (a, b)
            #expect(first.echo["method"] == .string("a"))
            #expect(second.echo["method"] == .string("b"))
        }
    }

    @Test func keepsUnicodeLineSeparatorsInsideAValue() async throws {
        try await withFakeHelper { client in
            let value = "one\u{2028}two\u{2029}three\u{85}four"
            let reply: Echo = try await client.call("load", ["file": value])
            #expect(reply.echo["params"]?["file"] == .string(value))
        }
    }

    @Test func failsTheOldestRequestWhenAReplyWillNotDecode() async throws {
        try await withFakeHelper { client in
            await #expect(throws: HelperClient.Failure.self) {
                let _: Echo = try await client.call("garbage", [String: String]())
            }
            let reply: Echo = try await client.call("load", ["file": "after"])
            #expect(reply.echo["params"]?["file"] == .string("after"))
        }
    }

    @Test func failsWaitingRequestsWhenTheHelperStops() async throws {
        try await withFakeHelper { client in
            let failure = await #expect(throws: HelperClient.Failure(message: "The helper stopped")) {
                let _: Echo = try await client.call("exit", [String: String]())
            }
            #expect(failure?.helperStopped == true)
            // a call after it stopped says so too, rather than waiting forever
            let later = await #expect(throws: HelperClient.Failure.self) {
                let _: Echo = try await client.call("load", [String: String]())
            }
            #expect(later?.helperStopped == true)
        }
    }

    /// The client is never started, so it cannot learn the helper stopped
    /// before it writes; the write must fail rather than raise SIGPIPE.
    @Test func throwsWhenWritingToAHelperThatHasExited() async throws {
        let client = try HelperClient(executable: URL(filePath: "/bin/sh"), arguments: ["-c", "exit 0"])
        try await Task.sleep(for: .milliseconds(500))
        await #expect(throws: (any Error).self) {
            let _: Echo = try await client.call("load", ["file": "x"])
        }
    }

    /// The app runs ccc beside the helper, and ccc can go quiet for minutes.
    @Test func answersWhileCccWritesNothing() async throws {
        let runner = CccRunner(configuration: fixture("ccc quiet"), restartLimit: 0, ready: { true })
        await runner.start()
        #expect(await waitFor(runner, .running))
        try await withFakeHelper { client in
            let answeredInTime = await withTaskGroup(of: Bool.self) { group in
                group.addTask {
                    let reply: Echo? = try? await client.call("load", ["file": "x"])
                    return reply != nil
                }
                group.addTask {
                    try? await Task.sleep(for: .seconds(2))
                    return false
                }
                let first = await group.next() ?? false
                // ends ccc's output, which frees a call held up behind its reader
                await runner.stop()
                group.cancelAll()
                return first
            }
            #expect(answeredInTime)
        }
    }

    @Test func encodesEditOps() throws {
        let ops: [EditOp] = [.set(["schedule", 0, "to"], .string("9:00pm")), .delete(["links", 1])]
        let json = String(decoding: try JSONEncoder.sorted.encode(ops), as: UTF8.self)
        #expect(json == #"[{"path":["schedule",0,"to"],"value":"9:00pm"},{"delete":true,"path":["links",1]}]"#)
    }
}
