import DataEditorKit
import Foundation

/// What the app bundles under `Contents/Resources/Runtime`.
nonisolated struct Runtime {
    let root: URL

    static let bundled = Runtime(root: Bundle.main.resourceURL!.appending(path: "Runtime"))

    var node: URL { root.appending(path: "node") }
    var helperDirectory: URL { root.appending(path: "helper") }
    var cccRoot: URL { root.appending(path: "ccc") }

    /// oxfmt's standalone binary, which the helper runs to write the data in the repo's style.
    var oxfmt: URL { root.appending(path: "oxfmt") }

    /// The Node the preview downloads at its first start.
    func nodeRelease() throws -> NodeRelease {
        try JSONDecoder().decode(NodeRelease.self, from: Data(contentsOf: root.appending(path: "node.json")))
    }

    /// The ccc-server commit the preview downloads at its first start.
    func cccCommit() throws -> String {
        try String(contentsOf: root.appending(path: "ccc-server.ref"), encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    func stamp() throws -> HelperStamp {
        try JSONDecoder().decode(HelperStamp.self, from: Data(contentsOf: helperDirectory.appending(path: "helper-stamp.json")))
    }

    /// Copies the helper into `workspace/scripts/`, where the paths it works
    /// out from its own location (`../data`, `../images`) are the workspace's.
    func installHelper(into workspace: URL) throws {
        let fm = FileManager.default
        let scripts = workspace.appending(path: "scripts")
        try? fm.removeItem(at: scripts)
        try fm.createDirectory(at: workspace, withIntermediateDirectories: true)
        try fm.copyItem(at: helperDirectory, to: scripts)
    }
}
