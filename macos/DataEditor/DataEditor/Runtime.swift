import DataEditorKit
import Foundation

/// What the app bundles under `Contents/Resources/Runtime`.
nonisolated struct Runtime {
    let root: URL

    static let bundled = Runtime(root: Bundle.main.resourceURL!.appending(path: "Runtime"))

    var node: URL { root.appending(path: "node") }
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
}
