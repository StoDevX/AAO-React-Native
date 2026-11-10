import DataEditorKit
import SwiftUI

/// The main window: the building list and its editor, with how the launch
/// is going in place of the editor until the data is ready.
struct ContentView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @State private var showingChanges = false

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
                Button("Changes", systemImage: "doc.badge.ellipsis") { showingChanges = true }
                    .badge(model.changedFiles.count)
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
                                   description: Text("The data now expects newer scripts than this copy of the Data Editor has. Choose Check for Updates… in the app menu."))
        case .failed(let message):
            ContentUnavailableView {
                Label("The Data Editor could not start", systemImage: "exclamationmark.triangle")
            } description: { Text(message) } actions: {
                Button("Try Again") { Task { await model.launch() } }
            }
        case .ready:
            if let document = model.document {
                HoursDetailView(document: document)
            } else {
                ContentUnavailableView("Choose a building", systemImage: "clock")
            }
        }
    }
}

/// The Data Browser window. Stands in until the browser is written.
struct DataBrowserView: View {
    var body: some View { Text("Data Browser") }
}

/// The edited files. Stands in until the review sheet, with its diffs and submitting, is written.
struct ChangesView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading) {
            List(model.changedFiles, id: \.self) { Text($0) }
            HStack {
                Spacer()
                Button("Done") { dismiss() }.keyboardShortcut(.defaultAction)
            }
        }
        .padding()
        .frame(minWidth: 360, minHeight: 240)
    }
}
