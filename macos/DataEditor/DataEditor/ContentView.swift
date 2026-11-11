import DataEditorKit
import SwiftUI

/// The main window: the building list and its editor, with how the launch
/// is going in place of the editor until the data is ready.
struct ContentView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @State private var showingChanges = false

    /// What the Changes button's badge counts: every edited file, and every
    /// file waiting for the contributor to choose between their copy and GitHub's.
    static func changeCount(changedFiles: [String], conflicts: [String]) -> Int {
        Set(changedFiles).union(conflicts).count
    }

    var body: some View {
        let ready = model.phase == .ready
        NavigationSplitView {
            BuildingList()
                .disabled(!ready)
        } detail: {
            detail
        }
        // room for a row of hours below the week, which a window saved smaller would hide
        .frame(minWidth: 900, minHeight: 600)
        .toolbar {
            ToolbarItem { ServerStatusView().disabled(!ready) }
            ToolbarItem {
                Button("Changes", systemImage: "doc.badge.ellipsis") {
                    // the sheet shows the text being typed in a field, which no toolbar click saves
                    Task {
                        _ = await model.commitPendingDrafts()
                        showingChanges = true
                    }
                }
                    .badge(Self.changeCount(changedFiles: model.changedFiles, conflicts: model.conflicts))
                    .disabled(!ready)
            }
            ToolbarItem { Button("Data Browser", systemImage: "curlybraces") { openWindow(id: "browser") }.disabled(!ready) }
        }
        .sheet(isPresented: $showingChanges) { ChangesView() }
    }

    /// The editor once the data is ready, and until then how the launch is going.
    @ViewBuilder private var detail: some View {
        switch model.phase {
        case .starting, .downloading:
            ProgressView(model.phase == .downloading ? "Downloading the app's data…" : "Starting…")
        case .needsAppUpdate:
            ContentUnavailableView("An update is needed to edit this data", systemImage: "arrow.down.app",
                                   description: Text("Download the newest Data Editor, then open it again."))
        case .failed(let message):
            ContentUnavailableView {
                Label("The Data Editor could not start", systemImage: "exclamationmark.triangle")
            } description: { Text(message) } actions: {
                Button("Try Again") { Task { await model.launch() } }
            }
        case .ready:
            if let record = model.submissions.records.first(where: { $0.id == model.shownPullRequest }) {
                PullRequestDetailView(record: record)
            } else if let document = model.document {
                HoursDetailView(document: document)
            } else {
                ContentUnavailableView("Choose a building", systemImage: "clock")
            }
        }
    }
}
