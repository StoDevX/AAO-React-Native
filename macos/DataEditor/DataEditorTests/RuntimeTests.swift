import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

struct RuntimeTests {
    @Test func readsThePreviewsPins() throws {
        let resources = FileManager.default.temporaryDirectory.appending(path: "runtime \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: resources, withIntermediateDirectories: true)
        try Data(#"{"version":"24.22.0","url":"https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz","sha256":"6a97"}"#.utf8)
            .write(to: resources.appending(path: "node.json"))
        try Data("cda256d\n".utf8).write(to: resources.appending(path: "ccc-server.ref"))
        let runtime = Runtime(root: resources, oxfmt: resources.appending(path: "oxfmt"))

        #expect(try runtime.nodeRelease() == NodeRelease(version: "24.22.0",
                                                         url: URL(string: "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz")!,
                                                         sha256: "6a97"))
        #expect(try runtime.cccCommit() == "cda256d")
    }

    /// Notarization takes code from `Contents/Helpers`, signed with the app, and refuses it among the resources.
    @Test func bundlesOxfmtAsAHelperTool() {
        let oxfmt = Runtime.bundled.oxfmt
        #expect(oxfmt.deletingLastPathComponent().path().hasSuffix("Contents/Helpers/"))
        #expect(FileManager.default.isExecutableFile(atPath: oxfmt.path))
    }
}
