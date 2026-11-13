import Foundation
import Testing
@testable import DataEditorKit

/// A helper whose handlers echo their method and parameters, fail on "fail",
/// and build into a folder named by the call and the build it is told is served.
private func client() throws -> HelperClient {
    let folder = FileManager.default.temporaryDirectory.appending(path: "helper client \(UUID().uuidString)/scripts")
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    try Data("""
        globalThis.dataEditorHelper = {PROTOCOL: 1, createHandlers: () => ({
            load: async (params) => ({echo: {method: 'load', params}}),
            fail: async () => { throw new Error('it failed') },
            build: async ({serving}) => ({ok: true, problems: [], dir: serving ? `${serving}/next` : '/builds/1'}),
        })}
        """.utf8).write(to: folder.appending(path: "helper.js"))
    try Data().write(to: folder.appending(path: "bundle-data.js"))
    let workspace = folder.deletingLastPathComponent()
    return HelperClient(runtime: try HelperRuntime(scripts: folder, data: workspace.appending(path: "data"),
                                                   out: workspace.appending(path: "out"), oxfmt: URL(filePath: "/usr/bin/false")))
}

private struct Echo: Decodable, Sendable { let echo: JSONValue }

struct HelperClientTests {
    @Test func decodesARecordByItsFileAndPath() throws {
        let json = #"{"set":"faqs","file":"faqs.yaml","path":["faqs",0],"title":"Say hello to us","subtitle":null,"section":null,"editable":true}"#
        let record = try JSONDecoder().decode(RecordSummary.self, from: Data(json.utf8))
        #expect(record.ref == RecordRef(file: "faqs.yaml", path: ["faqs", 0]))
        #expect(record.title == "Say hello to us")
        #expect(record.subtitle == nil)
    }

    @Test func decodesACatalogSet() throws {
        let json = #"{"groups":[{"title":"Help","sets":["faqs"]}],"sets":{"faqs":{"title":"FAQs & Notices","record":"FAQ","shape":"list","path":"faqs.yaml","list":["faqs"],"schema":"faqs","steers":{"what":"the timetables","run":"the refresh"}}}}"#
        let catalog = try JSONDecoder().decode(DataSetCatalog.self, from: Data(json.utf8))
        let faqs = try #require(catalog.sets["faqs"])
        #expect(faqs.shape == .list)
        #expect(faqs.form == .generated)
        #expect(faqs.steers == DataSet.Steers(what: "the timetables", run: "the refresh"))
    }

    @Test func returnsTheResultForItsRequest() async throws {
        let reply: Echo = try await client().call("load", ["file": "building-hours/1-1-cage.yaml"])
        #expect(reply.echo["method"] == .string("load"))
        #expect(reply.echo["params"]?["file"] == .string("building-hours/1-1-cage.yaml"))
    }

    @Test func throwsTheHelpersError() async throws {
        let helper = try client()
        await #expect(throws: HelperClient.Failure(message: "it failed")) {
            let _: Echo = try await helper.call("fail", [String: String]())
        }
        // a refused call leaves the helper answering
        let reply: Echo = try await helper.call("load", ["file": "after"])
        #expect(reply.echo["params"]?["file"] == .string("after"))
    }

    @Test func describesAFailureByTheHelpersMessage() {
        #expect(HelperClient.Failure(message: "x is outside the workspace").localizedDescription == "x is outside the workspace")
    }

    @Test func keepsUnicodeLineSeparatorsInsideAValue() async throws {
        let value = "one\u{2028}two\u{2029}three\u{85}four"
        let reply: Echo = try await client().call("load", ["file": value])
        #expect(reply.echo["params"]?["file"] == .string(value))
    }

    /// The app serves the folder the build reports.
    @Test func readsTheBuildsFolder() async throws {
        let result = try await client().build(serving: nil)
        #expect(result.ok)
        #expect(result.dir == "/builds/1")
    }

    /// The helper keeps the build the app serves, which a restarted helper cannot know.
    @Test func namesTheBuildItServes() async throws {
        let result = try await client().build(serving: URL(filePath: "/builds/1"))
        #expect(result.dir == "/builds/1/next")
    }

    @Test func encodesEditOps() throws {
        let ops: [EditOp] = [.set(["schedule", 0, "to"], .string("9:00pm")), .delete(["links", 1])]
        let json = String(decoding: try JSONEncoder.sorted.encode(ops), as: UTF8.self)
        #expect(json == #"[{"path":["schedule",0,"to"],"value":"9:00pm"},{"delete":true,"path":["links",1]}]"#)
    }
}
