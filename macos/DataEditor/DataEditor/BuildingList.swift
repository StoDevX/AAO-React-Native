import DataEditorKit
import SwiftUI

/// Every building with hours, by category, marking the ones edited.
struct BuildingList: View {
    @Environment(AppModel.self) private var model

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

    /// A conflict first: the file cannot be edited until the contributor chooses in Changes.
    private func icon(for file: String) -> String {
        if model.isConflicted(file) { return "exclamationmark.2" }
        return model.changedFiles.contains(file) ? "pencil.circle.fill" : "building.2"
    }

    var body: some View {
        @Bindable var model = model
        List(selection: $model.selection) {
            ForEach(Self.sections(of: model.buildings), id: \.title) { section in
                Section(section.title) {
                    ForEach(section.buildings) { building in
                        Label(building.name, systemImage: icon(for: building.file))
                            .tag(building.file)
                    }
                }
            }
        }
        .accessibilityIdentifier("building-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}
