import DataEditorKit
import SwiftUI

/// A changeset window's second column: the chosen data set's records, by
/// section, marking those edited and those with problems.
struct RecordList: View {
    @Environment(AppModel.self) private var model
    let changeset: Changeset
    let records: [RecordSummary]
    @Binding var selection: RecordRef?

    /// The records by section, as the phone app's lists show them: each
    /// section where its first record comes, the records in the order given,
    /// which is the order the data is published in. A record with no section
    /// goes under Other when others have one; a set none of whose records has
    /// one is a single list without a header.
    nonisolated static func sections(of records: [RecordSummary]) -> [(title: String?, records: [RecordSummary])] {
        guard records.contains(where: { $0.section != nil }) else { return [(nil, records)] }
        var sections: [(title: String?, records: [RecordSummary])] = []
        for record in records {
            let title = record.section ?? "Other"
            if let index = sections.firstIndex(where: { $0.title == title }) {
                sections[index].records.append(record)
            } else {
                sections.append((title, [record]))
            }
        }
        return sections
    }

    /// Under Current changes, a conflict first: the file cannot be edited until
    /// the contributor chooses on the Overview. Under a pull request, its files read only.
    private func icon(for file: String) -> String {
        guard changeset == .current else { return "doc.text" }
        if model.isConflicted(file) { return "exclamationmark.2" }
        return model.changedFiles.contains(file) ? "pencil.circle.fill" : "doc"
    }

    @ViewBuilder private func rows(_ records: [RecordSummary], blocking: Set<String>) -> some View {
        ForEach(records) { record in
            HStack {
                Label(record.title, systemImage: icon(for: record.ref.file))
                if blocking.contains(record.ref.file) {
                    Spacer()
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                        .accessibilityLabel("Has problems")
                }
            }
            .tag(record.ref)
        }
    }

    var body: some View {
        let blocking = changeset == .current ? model.overviewParts.problemFiles : []
        List(selection: $selection) {
            ForEach(Self.sections(of: records), id: \.title) { section in
                if let title = section.title {
                    Section(title) { rows(section.records, blocking: blocking) }
                } else {
                    rows(section.records, blocking: blocking)
                }
            }
        }
        // tells Current changes' window from a pull request's, whose titles follow the record chosen
        .accessibilityIdentifier(changeset == .current ? "record-list" : "pull-request-record-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}
