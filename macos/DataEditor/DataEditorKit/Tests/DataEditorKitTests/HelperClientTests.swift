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

    @Test func matchesConcurrentRepliesToTheirRequests() async throws {
        try await withFakeHelper { client in
            async let a: Echo = client.call("a", [String: String]())
            async let b: Echo = client.call("b", [String: String]())
            let (first, second) = try await (a, b)
            #expect(first.echo["method"] == .string("a"))
            #expect(second.echo["method"] == .string("b"))
        }
    }

    @Test func failsWaitingRequestsWhenTheHelperStops() async throws {
        try await withFakeHelper { client in
            await #expect(throws: HelperClient.Failure(message: "The helper stopped")) {
                let _: Echo = try await client.call("exit", [String: String]())
            }
        }
    }

    @Test func encodesEditOps() throws {
        let ops: [EditOp] = [.set(["schedule", 0, "to"], .string("9:00pm")), .delete(["links", 1])]
        let json = String(decoding: try JSONEncoder.sorted.encode(ops), as: UTF8.self)
        #expect(json == #"[{"path":["schedule",0,"to"],"value":"9:00pm"},{"delete":true,"path":["links",1]}]"#)
    }
}
