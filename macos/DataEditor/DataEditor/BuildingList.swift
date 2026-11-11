import DataEditorKit
import SwiftUI

/// Every building with hours, by category, marking the ones edited, and
/// below them the pull requests submitted from this app.
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
        let selection = Binding(get: { model.sidebarSelection }, set: { item in Task { await model.choose(item) } })
        List(selection: selection) {
            ForEach(Self.sections(of: model.buildings), id: \.title) { section in
                Section(section.title) {
                    ForEach(section.buildings) { building in
                        Label(building.name, systemImage: icon(for: building.file))
                            .tag(AppModel.SidebarItem.building(file: building.file))
                    }
                }
            }
            // like Mail's, it is not there until there is something in it
            if !model.submissions.records.isEmpty {
                Section("Activity") {
                    ForEach(model.submissions.records) { record in
                        ActivityRow(record: record)
                            .tag(AppModel.SidebarItem.pullRequest(number: record.id))
                    }
                }
            }
        }
        .accessibilityIdentifier("building-list")
        .navigationSplitViewColumnWidth(min: 220, ideal: 260)
    }
}

/// A pull request in the Activity section: its summary, with its state beneath.
private struct ActivityRow: View {
    let record: SubmissionRecord

    var body: some View {
        let state = PullRequestState(record.state)
        Label {
            VStack(alignment: .leading) {
                Text(record.summary).lineLimit(1)
                Text(state.name).font(.caption).foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: state.systemImage)
        }
        .accessibilityElement(children: .ignore)
        // a number in the label's text would be grouped, as in 8,123
        .accessibilityLabel("\(record.summary), pull request \(String(record.id)), \(state.name)")
        .accessibilityIdentifier("pull-request-\(record.id)")
    }
}
