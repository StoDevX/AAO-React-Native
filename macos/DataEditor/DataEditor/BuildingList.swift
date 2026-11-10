import DataEditorKit
import SwiftUI

/// Every building with hours, by category, marking the ones edited.
struct BuildingList: View {
    @Environment(AppModel.self) private var model

    private var categories: [(String, [BuildingSummary])] {
        Dictionary(grouping: model.buildings, by: \.category).sorted { $0.key < $1.key }
    }

    var body: some View {
        @Bindable var model = model
        List(selection: $model.selection) {
            ForEach(categories, id: \.0) { category, buildings in
                Section(category.isEmpty ? "Other" : category) {
                    ForEach(buildings) { building in
                        Label(building.name, systemImage: model.changedFiles.contains(building.file) ? "pencil.circle.fill" : "building.2")
                            .tag(building.file)
                    }
                }
            }
        }
        .accessibilityIdentifier("building-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}
