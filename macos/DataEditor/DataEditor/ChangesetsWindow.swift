import DataEditorKit
import SwiftUI

/// The window the app opens with: the changesets, and the chosen one's
/// Overview, with how the launch is going in its place until the data is ready.
struct ChangesetsWindow: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @State private var selection: Changeset? = .current

    var body: some View {
        let ready = model.phase == .ready
        NavigationSplitView {
            if ready {
                ChangesetList(selection: $selection) { openWindow(value: $0) }
            } else {
                // nothing to choose until the data is ready
                List {}
            }
        } detail: {
            detail
        }
        .frame(minWidth: 800, minHeight: 500)
        .toolbar {
            ToolbarItem {
                Button("Open", systemImage: "macwindow") { if let selection { openWindow(value: selection) } }
                    .disabled(!ready || selection == nil)
            }
        }
    }

    /// The chosen changeset's Overview once the data is ready, and until then how the launch is going.
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
            switch selection {
            case .current?: OverviewView()
            case .pullRequest(let number)?: PullRequestDetailView(number: number)
            case nil: ContentUnavailableView("Choose a changeset", systemImage: "list.bullet.rectangle.portrait")
            }
        }
    }
}
