import Foundation

/// The Node archive the preview runs on: mise.lock's macOS arm64 entry,
/// written into the app as `node.json` by `scripts/data-editor-node-release.mjs`.
public struct NodeRelease: Codable, Equatable, Sendable {
    public let version: String
    public let url: URL
    /// The archive's SHA-256, in hex
    public let sha256: String

    public init(version: String, url: URL, sha256: String) {
        self.version = version
        self.url = url
        self.sha256 = sha256
    }
}
