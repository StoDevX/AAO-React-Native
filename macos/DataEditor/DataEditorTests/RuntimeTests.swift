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
}
