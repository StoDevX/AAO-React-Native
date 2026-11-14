import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

/// A model launched on a workspace holding the repo's data, as if downloaded,
/// with the helper built from the checkout, as the UI tests launch the app.
/// Needs `mise run data-editor:helper` and `mise run data-editor:runtime`.
@MainActor
func modelOnRepoData() async throws -> (model: AppModel, data: URL) {
    let repo = URL(filePath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().deletingLastPathComponent()
    let support = FileManager.default.temporaryDirectory.appending(path: "repo data \(UUID().uuidString)")
    let workspace = support.appending(path: "workspace")
    let files = FileManager.default
    try files.createDirectory(at: workspace.appending(path: "base"), withIntermediateDirectories: true)
    try files.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "data"))
    try files.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "base/data"))
    try files.copyItem(at: repo.appending(path: "images"), to: workspace.appending(path: "images"))
    try Data(#"{"commit":"c1"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
    try files.copyItem(at: repo.appending(path: "macos/DataEditor/build/helper"), to: workspace.appending(path: "scripts"))
    let model = AppModel(support: support, oxfmt: repo.appending(path: "macos/DataEditor/build/runtime/oxfmt"))
    await model.launch()
    try #require(model.phase == .ready)
    return (model, workspace.appending(path: "data"))
}
