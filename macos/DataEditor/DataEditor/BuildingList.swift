import DataEditorKit
import SwiftUI

/// Every building with hours, by category, marking the ones edited.
struct BuildingList: View {
    @Environment(AppModel.self) private var model

    private var categories: [(String, [BuildingSummary])] {
        Dictionary(grouping: model.buildings, by: \.category).sorted { $0.key < $1.key }
    }

    /// A conflict first: the file cannot be edited until the contributor chooses in Changes.
    private func icon(for file: String) -> String {
        if model.isConflicted(file) { return "exclamationmark.2" }
        return model.changedFiles.contains(file) ? "pencil.circle.fill" : "building.2"
    }

    var body: some View {
        @Bindable var model = model
        List(selection: $model.selection) {
            ForEach(categories, id: \.0) { category, buildings in
                Section(category.isEmpty ? "Other" : category) {
                    ForEach(buildings) { building in
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
