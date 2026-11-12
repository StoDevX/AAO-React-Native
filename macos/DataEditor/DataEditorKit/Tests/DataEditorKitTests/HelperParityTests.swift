import Foundation
import Testing
@testable import DataEditorKit

/// The checkout this test runs in.
private let repo = URL(filePath: #filePath)
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()

private let node = ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"]

/// The helper calls both engines make, in order: each kind of reply, an edit
/// oxfmt reformats, an edit the schema refuses, one the overlap check
/// refuses, a file that is not there, and builds between them.
private let steps: [(method: String, params: String)] = [
    ("list", "{}"),
    ("calendar", "{}"),
    ("load", #"{"file":"building-hours/1-1-cage.yaml"}"#),
    ("load", #"{"file":"building-hours/not-a-building.yaml"}"#),
    ("build", "{}"),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["links",0,"url"],"value":"https://example.com/\#(String(repeating: "a", count: 100))"}]}"#),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["name"],"value":5}]}"#),
    ("build", "{}"),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["name"],"value":"The Cage"},{"path":["schedule",0,"hours",1,"days"],"value":["Fr","Sa"]}]}"#),
    ("edit", #"{"file":"building-hours/1-1-cage.yaml","ops":[{"path":["schedule",0,"hours",1,"days"],"value":["Sa","Su"]}]}"#),
    ("build", "{}"),
]

/// A copy of the data and the published images, as the app downloads them.
private func workspace(_ name: String, in folder: URL) throws -> URL {
    let fm = FileManager.default
    let root = folder.appending(path: name)
    try fm.createDirectory(at: root, withIntermediateDirectories: true)
    try fm.copyItem(at: repo.appending(path: "data"), to: root.appending(path: "data"))
    try fm.copyItem(at: repo.appending(path: "images"), to: root.appending(path: "images"))
    return root
}

private func run(_ executable: String, _ arguments: [String], input: String = "") throws -> String {
    let process = Process()
    let stdin = Pipe(), stdout = Pipe()
    process.executableURL = URL(filePath: executable)
    process.arguments = arguments
    process.currentDirectoryURL = repo
    process.standardInput = stdin
    process.standardOutput = stdout
    process.standardError = FileHandle.standardError
    try process.run()
    try stdin.fileHandleForWriting.write(contentsOf: Data(input.utf8))
    try stdin.fileHandleForWriting.close()
    let output = stdout.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    return String(decoding: output, as: UTF8.self)
}

/// A reply as both engines can be compared: the result, or the error's message,
/// without the build's folder and with the workspace's own path as `<workspace>`,
/// since those differ between the two workspaces.
private func normalized(result: Any?, error: String?, workspace: URL) throws -> String {
    var value: Any = error.map { ["error": $0.replacingOccurrences(of: workspace.path, with: "<workspace>")] } ?? result ?? NSNull()
    if var object = value as? [String: Any] {
        object["dir"] = nil
        value = object
    }
    return String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed]), as: UTF8.self)
}

/// Every file under `folder`, by its path inside it, with its bytes.
private func files(in folder: URL) -> [String: Data] {
    var found: [String: Data] = [:]
    let prefix = folder.standardizedFileURL.path + "/"
    for case let url as URL in FileManager.default.enumerator(at: folder, includingPropertiesForKeys: nil)! {
        if let data = try? Data(contentsOf: url), !url.hasDirectoryPath {
            found[String(url.standardizedFileURL.path.dropFirst(prefix.count))] = data
        }
    }
    return found
}

@Suite(.enabled(if: node != nil, "run with DATA_EDITOR_NODE=$(mise which node)"))
struct HelperParityTests {
    @Test func javaScriptCoreGivesWhatNodeGives() async throws {
        let node = node!
        let folder = FileManager.default.temporaryDirectory.appending(path: "parity \(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: folder) }

        // Node runs the checkout's scripts, as CI does
        let nodeSide = try workspace("node", in: folder)
        let requests = steps.enumerated().map { #"{"id":\#($0.offset + 1),"method":"\#($0.element.method)","params":\#($0.element.params)}"# }
        let lines = try run(node, [repo.appending(path: "scripts/data-editor-helper.mjs").path,
                                   "--data", nodeSide.appending(path: "data").path, "--out", nodeSide.appending(path: "out").path],
                            input: requests.joined(separator: "\n") + "\n")
            .split(separator: "\n")
        var nodeReplies: [String] = []
        var nodeBuilds: [String] = []
        for line in lines {
            let reply = try JSONSerialization.jsonObject(with: Data(line.utf8)) as! [String: Any]
            let error = (reply["error"] as? [String: Any])?["message"] as? String
            nodeReplies.append(try normalized(result: reply["result"], error: error, workspace: nodeSide))
            if let dir = (reply["result"] as? [String: Any])?["dir"] as? String { nodeBuilds.append(dir) }
        }
        #expect(nodeReplies.count == steps.count)

        // JavaScriptCore runs the same scripts, bundled, with oxfmt's own command line standing in for its binary
        let jscSide = try workspace("jsc", in: folder)
        let scripts = jscSide.appending(path: "scripts")
        _ = try run(node, [repo.appending(path: "scripts/build-data-editor-helper.mjs").path, "--out", scripts.path, "--commit", "parity"])
        let oxfmt = folder.appending(path: "oxfmt")
        try Data("#!/bin/sh\nexec '\(node)' '\(repo.appending(path: "node_modules/oxfmt/bin/oxfmt").path)' \"$@\"\n".utf8).write(to: oxfmt)
        try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: oxfmt.path)
        let helper = try HelperRuntime(scripts: scripts, data: jscSide.appending(path: "data"), out: jscSide.appending(path: "out"), oxfmt: oxfmt)
        var jscReplies: [String] = []
        var jscBuilds: [String] = []
        for step in steps {
            do {
                let reply = try await helper.call(step.method, paramsJSON: step.params)
                let result = try JSONSerialization.jsonObject(with: Data(reply.utf8), options: .fragmentsAllowed)
                jscReplies.append(try normalized(result: result, error: nil, workspace: jscSide))
                if let dir = (result as? [String: Any])?["dir"] as? String { jscBuilds.append(dir) }
            } catch let failure as HelperRuntime.Failure {
                jscReplies.append(try normalized(result: nil, error: failure.message, workspace: jscSide))
            }
        }

        for (index, step) in steps.enumerated() {
            #expect(jscReplies[index] == nodeReplies[index], "step \(index + 1), \(step.method)")
        }
        #expect(files(in: jscSide.appending(path: "data")) == files(in: nodeSide.appending(path: "data")))
        // the build after the schema's refusal is refused too, so it names no folder
        #expect(jscBuilds.count == 2 && nodeBuilds.count == 2)
        for (jsc, node) in zip(jscBuilds, nodeBuilds) {
            #expect(files(in: URL(filePath: jsc)) == files(in: URL(filePath: node)))
        }
        // the steps meant to be refused were: the schema's and the overlap check's
        #expect(nodeReplies[6].contains("problems") && !nodeReplies[6].contains(#""problems":[]"#))
        #expect(nodeReplies[8].contains("problems") && !nodeReplies[8].contains(#""problems":[]"#))
    }
}
