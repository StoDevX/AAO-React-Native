import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

struct RuntimeTests {
    @Test func installsTheHelperIntoTheWorkspace() throws {
        let fm = FileManager.default
        let resources = fm.temporaryDirectory.appending(path: "runtime \(UUID().uuidString)")
        let helper = resources.appending(path: "helper")
        try fm.createDirectory(at: helper, withIntermediateDirectories: true)
        try Data("// helper".utf8).write(to: helper.appending(path: "data-editor-helper.mjs"))
        try Data("// bundle".utf8).write(to: helper.appending(path: "bundle-data.mjs"))
        try Data(#"{"files":{"scripts/a.mjs":"s"}}"#.utf8).write(to: helper.appending(path: "helper-stamp.json"))
        let runtime = Runtime(root: resources)
        let workspace = fm.temporaryDirectory.appending(path: "ws \(UUID().uuidString)")

        try runtime.installHelper(into: workspace)
        try runtime.installHelper(into: workspace)

        #expect(fm.fileExists(atPath: workspace.appending(path: "scripts/data-editor-helper.mjs").path))
        #expect(fm.fileExists(atPath: workspace.appending(path: "scripts/bundle-data.mjs").path))
        #expect(try runtime.stamp().files == ["scripts/a.mjs": "s"])
    }

    @Test func readsThePreviewsPinsBesideOxfmt() throws {
        let resources = FileManager.default.temporaryDirectory.appending(path: "runtime \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: resources, withIntermediateDirectories: true)
        try Data(#"{"version":"24.22.0","url":"https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz","sha256":"6a97"}"#.utf8)
            .write(to: resources.appending(path: "node.json"))
        try Data("cda256d\n".utf8).write(to: resources.appending(path: "ccc-server.ref"))
        let runtime = Runtime(root: resources)

        #expect(try runtime.nodeRelease() == NodeRelease(version: "24.22.0",
                                                         url: URL(string: "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz")!,
                                                         sha256: "6a97"))
        #expect(try runtime.cccCommit() == "cda256d")
        #expect(runtime.oxfmt == resources.appending(path: "oxfmt"))
    }
}
