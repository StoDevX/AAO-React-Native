import DataEditorKit
import SwiftUI

/// A changeset window's first column: its Overview, then the data sets in
/// their groups, marking those with edits. A pull request's lists only the
/// sets its files are in.
struct DataSetList: View {
    @Environment(AppModel.self) private var model
    let changeset: Changeset
    /// The sets a pull request changed, by name; nil lists every set.
    let only: Set<String>?
    @Binding var selection: ChangesetItem?

    /// The catalog's groups in order, each with its sets' names and titles.
    nonisolated static func sections(of catalog: DataSetCatalog) -> [(title: String, sets: [(id: String, title: String)])] {
        catalog.groups.map { group in
            (group.title, group.sets.compactMap { name in catalog.sets[name].map { (name, $0.title) } })
        }
    }

    /// Whether any changed file is in `set`, so its row carries the edited mark.
    private func isEdited(_ set: String) -> Bool {
        changeset == .current && model.changedFiles.contains { model.catalog?.set(for: $0) == set }
    }

    var body: some View {
        List(selection: $selection) {
            Label("Overview", systemImage: "list.bullet.rectangle")
                .tag(ChangesetItem.overview)
                .accessibilityIdentifier("overview")
            if let catalog = model.catalog {
                ForEach(Self.sections(of: catalog), id: \.title) { section in
                    let sets = section.sets.filter { only?.contains($0.id) ?? true }
                    if !sets.isEmpty {
                        Section(section.title) {
                            ForEach(sets, id: \.id) { set in
                                Label(set.title, systemImage: isEdited(set.id) ? "pencil.circle.fill" : "folder")
                                    .tag(ChangesetItem.set(set.id))
                            }
                        }
                    }
                }
            }
        }
        .accessibilityIdentifier("data-set-list")
        .navigationSplitViewColumnWidth(min: 180, ideal: 210)
    }
}
