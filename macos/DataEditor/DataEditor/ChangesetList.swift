import DataEditorKit
import SwiftUI

/// The Changesets window's list: the edits in hand, then each pull request
/// submitted from this app. Double-clicking one opens it; Return is the window's Open.
struct ChangesetList: View {
    @Environment(AppModel.self) private var model
    @Binding var selection: Changeset?
    let open: (Changeset) -> Void

    /// What Current changes' badge counts: every edited file, and every file
    /// waiting for the contributor to choose between their copy and GitHub's.
    static func changeCount(changedFiles: [String], conflicts: [String]) -> Int {
        Set(changedFiles).union(conflicts).count
    }

    var body: some View {
        let parts = model.overviewParts
        // something stands between these edits and a review, or the phone
        let blocked = !parts.problems.isEmpty || !parts.conflicts.isEmpty || (parts.preview.map { $0 != .upToDate } ?? false)
        List(selection: $selection) {
            Label {
                HStack {
                    Text("Current changes")
                    if blocked {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                            .accessibilityLabel("Needs attention")
                    }
                }
            } icon: { Image(systemName: "pencil.and.list.clipboard") }
                .badge(Self.changeCount(changedFiles: model.changedFiles, conflicts: model.conflicts))
                .tag(Changeset.current)
                .accessibilityIdentifier("changeset-current")
            // like Mail's, it is not there until there is something in it
            if !model.submissions.records.isEmpty {
                Section("Submitted") {
                    ForEach(model.submissions.records) { record in
                        PullRequestRow(record: record)
                            .tag(Changeset.pullRequest(number: record.id))
                    }
                }
            }
        }
        .contextMenu(forSelectionType: Changeset.self) { _ in } primaryAction: { chosen in
            if let changeset = chosen.first { open(changeset) }
        }
        .accessibilityIdentifier("changeset-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}

/// A submitted pull request: its summary, with its number and state beneath.
private struct PullRequestRow: View {
    let record: SubmissionRecord

    var body: some View {
        let state = PullRequestState(record.state)
        Label {
            VStack(alignment: .leading) {
                Text(record.summary).lineLimit(1)
                // a number in the text would be grouped, as in 8,123
                Text("#\(String(record.id)) · \(state.name)").font(.caption).foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: state.systemImage)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(record.summary), pull request \(String(record.id)), \(state.name)")
        .accessibilityIdentifier("pull-request-\(record.id)")
    }
}
