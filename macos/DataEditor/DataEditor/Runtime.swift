import DataEditorKit
import Foundation

/// What the app bundles under `Contents/Resources/Runtime`: Node, the helper, and ccc-server.
nonisolated struct Runtime {
    let root: URL

    static let bundled = Runtime(root: Bundle.main.resourceURL!.appending(path: "Runtime"))

    var node: URL { root.appending(path: "node") }
    var helperDirectory: URL { root.appending(path: "helper") }
    var cccRoot: URL { root.appending(path: "ccc") }

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
