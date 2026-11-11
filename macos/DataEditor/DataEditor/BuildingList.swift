import DataEditorKit
import SwiftUI

/// A changeset window's list: its Overview, then its buildings by
/// category, marking those edited and those with problems.
struct BuildingList: View {
    @Environment(AppModel.self) private var model
    let changeset: Changeset
    @Binding var selection: ChangesetItem?

    /// The buildings by category, as the phone app's hours list shows them:
    /// each category where its first building comes, the buildings in the
    /// order given, which is the order the data is published in, and those
    /// with no category under Other.
    static func sections(of buildings: [BuildingSummary]) -> [(title: String, buildings: [BuildingSummary])] {
        var sections: [(title: String, buildings: [BuildingSummary])] = []
        for building in buildings {
            let title = building.category.isEmpty ? "Other" : building.category
            if let index = sections.firstIndex(where: { $0.title == title }) {
                sections[index].buildings.append(building)
            } else {
                sections.append((title, [building]))
            }
        }
        return sections
    }

    /// Under Current changes, a conflict first: the file cannot be edited until
    /// the contributor chooses on the Overview. Under a pull request, its files read only.
    private func icon(for file: String) -> String {
        guard changeset == .current else { return "doc.text" }
        if model.isConflicted(file) { return "exclamationmark.2" }
        return model.changedFiles.contains(file) ? "pencil.circle.fill" : "building.2"
    }

    var body: some View {
        let shown = changesetBuildings(changeset, all: model.buildings, history: model.submissions)
        let blocking = changeset == .current ? Set(model.buildProblems.compactMap(\.file)) : []
        List(selection: $selection) {
            Label("Overview", systemImage: "list.bullet.rectangle")
                .tag(ChangesetItem.overview)
                .accessibilityIdentifier("overview")
            ForEach(Self.sections(of: shown), id: \.title) { section in
                Section(section.title) {
                    ForEach(section.buildings) { building in
                        HStack {
                            Label(building.name, systemImage: icon(for: building.file))
                            if blocking.contains(building.file) {
                                Spacer()
                                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                                    .accessibilityLabel("Has problems")
                            }
                        }
                        .tag(ChangesetItem.building(file: building.file))
                    }
                }
            }
        }
        .accessibilityIdentifier("building-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}
