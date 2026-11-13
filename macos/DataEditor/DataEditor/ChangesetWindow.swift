import DataEditorKit
import SwiftUI

/// One changeset's window: its Overview and data sets, the chosen set's
/// records, and on the right the Overview, a record's editor, or for a pull
/// request its diff.
struct ChangesetWindow: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    let changeset: Changeset
    /// What a pull request's window shows; Current changes' is the model's `item`.
    @State private var pullRequestItem: ChangesetItem = .overview

    var body: some View {
        let ready = model.phase == .ready
        let item: Binding<ChangesetItem> = switch changeset {
        case .current: Binding(get: { model.item }, set: { item in Task { await model.choose(item) } })
        case .pullRequest: $pullRequestItem
        }
        let listed = changesetRecords(changeset, catalog: model.catalog, records: model.records, history: model.submissions)
        // a pull request's window opens on the first set it changed
        let set = item.wrappedValue.set ?? (changeset == .current ? model.chosenSet : listed.keys.sorted().first) ?? ""
        let setSelection = Binding<ChangesetItem?>(
            get: { if case .record(let set, _) = item.wrappedValue { .set(set) } else { item.wrappedValue } },
            set: { item.wrappedValue = $0 ?? .overview })
        let recordSelection = Binding<RecordRef?>(
            get: { if case .record(_, let ref) = item.wrappedValue { ref } else { nil } },
            set: { ref in if let ref { item.wrappedValue = .record(set: set, ref) } })
        NavigationSplitView {
            DataSetList(changeset: changeset, only: changeset == .current ? nil : Set(listed.keys), selection: setSelection)
                .disabled(!ready)
        } content: {
            RecordList(changeset: changeset, records: listed[set] ?? [], selection: recordSelection)
                .disabled(!ready)
        } detail: {
            if ready { detail(item.wrappedValue) } else { LaunchStatusView() }
        }
        .navigationTitle(title)
        // asked once as the window opens, not again on each row chosen in it
        .task(id: changeset) { if case .pullRequest(let number) = changeset { await model.loadDiffs(of: number) } }
        // room for a row of hours below the week, which a window saved smaller would hide
        .frame(minWidth: 1100, minHeight: 600)
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
            OverviewView(offersEditor: false)
        case (_, .set(let set)):
            ContentUnavailableView("Choose a \(model.catalog?.sets[set]?.record ?? "record")", systemImage: "sidebar.left")
        case (.current, .record(let set, let ref)):
            if model.catalog?.sets[set]?.form == .hours {
                if let document = model.document, model.documentFile == ref.file {
                    HoursDetailView(document: document)
                } else {
                    ProgressView()
                }
            } else if let dataSet = model.catalog?.sets[set], dataSet.shape == .document {
                DocumentEditorView(file: ref.file)
            } else if let dataSet = model.catalog?.sets[set], let record = model.records[set]?.first(where: { $0.ref == ref }) {
                RecordFormView(setName: set, set: dataSet, record: record)
            } else {
                ProgressView()
            }
        case (.pullRequest(let number), .overview):
            PullRequestDetailView(number: number)
        case (.pullRequest(let number), .record(_, let ref)):
            PullRequestFileView(number: number, file: ref.file)
        }
    }
}
