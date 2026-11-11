import DataEditorKit
import SwiftUI

/// The main window: the changesets, a changeset's buildings, and the
/// chosen one's detail, with how the launch is going in its place until the data is ready.
struct ContentView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow

    /// What Current changes' badge counts: every edited file, and every file
    /// waiting for the contributor to choose between their copy and GitHub's.
    static func changeCount(changedFiles: [String], conflicts: [String]) -> Int {
        Set(changedFiles).union(conflicts).count
    }

    var body: some View {
        let ready = model.phase == .ready
        NavigationSplitView {
            ChangesetList()
                .disabled(!ready)
        } content: {
            BuildingList()
                .disabled(!ready)
        } detail: {
            detail
        }
        // room for a row of hours below the week beside both lists, which a window saved smaller would hide
        .frame(minWidth: 1100, minHeight: 600)
        .toolbar {
            ToolbarItem { ServerStatusView().disabled(!ready) }
            ToolbarItem { Button("Data Browser", systemImage: "curlybraces") { openWindow(id: "browser") }.disabled(!ready) }
        }
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
            switch (model.changeset, model.item) {
            case (.current, .overview):
                OverviewView()
            case (.current, .building):
                if let document = model.document {
                    HoursDetailView(document: document)
                } else {
                    ProgressView()
                }
            case (.pullRequest(let number), .overview):
                PullRequestDetailView(number: number)
            case (.pullRequest(let number), .building(let file)):
                PullRequestFileView(number: number, file: file)
            }
        }
    }
}
