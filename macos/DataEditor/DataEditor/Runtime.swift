import DataEditorKit
import Foundation

/// What the app bundles: oxfmt as a helper tool in `Contents/Helpers`, and
/// under `Contents/Resources/Runtime` the Node and ccc-server the preview downloads.
nonisolated struct Runtime {
    let root: URL
    /// oxfmt's standalone binary, which the helper runs to write the data in the repo's style.
    let oxfmt: URL

    static let bundled = Runtime(root: Bundle.main.resourceURL!.appending(path: "Runtime"),
                                 oxfmt: Bundle.main.bundleURL.appending(path: "Contents/Helpers/oxfmt"))

    /// The Node the preview downloads at its first start.
    func nodeRelease() throws -> NodeRelease {
        try JSONDecoder().decode(NodeRelease.self, from: Data(contentsOf: root.appending(path: "node.json")))
    }

    /// The ccc-server commit the preview downloads at its first start.
    func cccCommit() throws -> String {
        try String(contentsOf: root.appending(path: "ccc-server.ref"), encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
