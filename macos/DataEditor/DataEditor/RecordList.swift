import DataEditorKit
import SwiftUI

/// A changeset window's second column: the chosen data set's records, by
/// section, marking those edited and those with problems.
struct RecordList: View {
    @Environment(AppModel.self) private var model
    let changeset: Changeset
    /// the set listed, by name, and what the catalog says of it
    let setName: String
    let set: DataSet?
    let records: [RecordSummary]
    @Binding var selection: RecordRef?
    @State private var adding = false
    @State private var removing: RecordSummary?

    /// Whether the set takes new records and loses old ones here: Current
    /// changes, a set of many records, and one nothing else writes.
    private var changesRecords: Bool {
        guard changeset == .current, let set, set.readOnly == nil else { return false }
        return set.shape == .folder || set.shape == .list
    }

    /// Whether the order of the set's records is the contributor's to change.
    private var reorders: Bool {
        changesRecords && set.map(AppModel.reorders) == true
    }

    /// The whole set's order once `section`'s records move as `List` asks.
    private func order(moving offsets: IndexSet, to destination: Int, in section: Int) -> [RecordRef] {
        var sections = Self.sections(of: records)
        sections[section].records.move(fromOffsets: offsets, toOffset: destination)
        return sections.flatMap { $0.records.map(\.ref) }
    }

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

    @ViewBuilder private func rows(_ records: [RecordSummary], section: Int, blocking: Set<String>) -> some View {
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
            .contextMenu {
                if changesRecords, record.editable, let set, !AppModel.keepsItsName(set: set, file: record.ref.file) {
                    Button("Delete \(record.title)…", role: .destructive) { removing = record }
                }
            }
        }
        .onMove(perform: reorders ? { offsets, destination in
            let order = order(moving: offsets, to: destination, in: section)
            Task { await model.reorderRecords(in: setName, order: order) }
        } : nil)
    }

    var body: some View {
        let blocking = changeset == .current ? model.overviewParts.problemFiles : []
        VStack(spacing: 0) {
        List(selection: $selection) {
            ForEach(Array(Self.sections(of: records).enumerated()), id: \.element.title) { index, section in
                if let title = section.title {
                    Section(title) { rows(section.records, section: index, blocking: blocking) }
                } else {
                    rows(section.records, section: index, blocking: blocking)
                }
            }
        }
        // tells Current changes' window from a pull request's, whose titles follow the record chosen
        .accessibilityIdentifier(changeset == .current ? "record-list" : "pull-request-record-list")
        .onDeleteCommand {
            guard changesRecords, let set, let selection, let record = records.first(where: { $0.ref == selection }), record.editable,
                  !AppModel.keepsItsName(set: set, file: record.ref.file) else { return }
            removing = record
        }
        if changesRecords, let set {
            Divider()
            Button("New \(set.record)", systemImage: "plus") { adding = true }
                .keyboardShortcut("n")
                .buttonStyle(.borderless)
                .disabled(!model.mayChangeRecords)
                .accessibilityIdentifier("new-record")
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        }
        .sheet(isPresented: $adding) {
            if let set {
                NewRecordSheet(kind: set.record, sections: set.sectionField == nil ? [] : Self.sections(of: records).compactMap(\.title)) { title, section in
                    Task { await model.createRecord(in: setName, title: title, section: section) }
                }
            }
        }
        .confirmationDialog(removing.map { "Delete \($0.title)?" } ?? "", isPresented: Binding(get: { removing != nil }, set: { if !$0 { removing = nil } })) {
            Button("Delete", role: .destructive) {
                if let removing { Task { await model.removeRecord(removing.ref, from: setName) } }
                removing = nil
            }
        } message: {
            Text("It goes from the data when your changes are merged. Revert the file on the Overview to bring it back before then.")
        }
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}

/// Asks for a new record's title, and its section when the set has sections.
private struct NewRecordSheet: View {
    @Environment(\.dismiss) private var dismiss
    /// what one record is called, as "Contact"
    let kind: String
    /// the set's sections, in order; empty when it has none
    let sections: [String]
    let add: (_ title: String, _ section: String?) -> Void
    @State private var title = ""
    @State private var section = ""

    var body: some View {
        Form {
            TextField("Title", text: $title).accessibilityIdentifier("new-record-title")
            if !sections.isEmpty {
                Picker("Section", selection: $section) {
                    ForEach(sections, id: \.self) { Text($0).tag($0) }
                }
            }
            HStack {
                Spacer()
                Button("Cancel", role: .cancel) { dismiss() }
                Button("Add") {
                    add(title.trimmingCharacters(in: .whitespaces), sections.isEmpty ? nil : section)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                .accessibilityIdentifier("new-record-add")
            }
        }
        .padding()
        .frame(minWidth: 320)
        .navigationTitle("New \(kind)")
        .onAppear { section = sections.first ?? "" }
    }
}
