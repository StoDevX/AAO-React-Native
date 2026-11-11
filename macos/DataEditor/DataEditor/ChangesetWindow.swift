import DataEditorKit
import SwiftUI

/// One changeset's window: its Overview and buildings on the left, and on the
/// right the Overview, a building's editor, or for a pull request its diff.
struct ChangesetWindow: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    let changeset: Changeset
    /// What a pull request's window shows; Current changes' is the model's `item`.
    @State private var pullRequestItem: ChangesetItem = .overview

    var body: some View {
        let ready = model.phase == .ready
        let selection: Binding<ChangesetItem?> = switch changeset {
        case .current: Binding(get: { model.item }, set: { item in Task { await model.choose(item ?? .overview) } })
        case .pullRequest: Binding(get: { pullRequestItem }, set: { pullRequestItem = $0 ?? .overview })
        }
        NavigationSplitView {
            BuildingList(changeset: changeset, selection: selection)
                .disabled(!ready)
        } detail: {
            if ready { detail(selection.wrappedValue ?? .overview) } else { ProgressView() }
        }
        .navigationTitle(title)
        // room for a row of hours below the week, which a window saved smaller would hide
        .frame(minWidth: 900, minHeight: 600)
        .toolbar {
            ToolbarItem { ServerStatusView().disabled(!ready) }
            ToolbarItem { Button("Data Browser", systemImage: "curlybraces") { openWindow(id: "browser") }.disabled(!ready) }
            ToolbarItem { Button("Changesets", systemImage: "list.bullet.rectangle.portrait") { openWindow(id: "changesets") } }
        }
    }

    private var title: String {
        switch changeset {
        case .current: "Current changes"
        case .pullRequest(let number): model.submissions.records.first { $0.id == number }?.summary ?? "Pull request #\(String(number))"
        }
    }

    @ViewBuilder private func detail(_ item: ChangesetItem) -> some View {
        switch (changeset, item) {
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
