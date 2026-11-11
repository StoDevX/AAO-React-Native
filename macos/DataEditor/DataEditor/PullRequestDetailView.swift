import DataEditorKit
import SwiftUI

/// A pull request's state as the Activity section and its detail name it.
struct PullRequestState {
    let name: String
    let systemImage: String

    /// - Parameter state: nil when GitHub has not said, or could not be asked
    init(_ state: SubmissionState?) {
        (name, systemImage) = switch state {
        case .open?: ("Open", "clock")
        case .changesRequested?: ("Changes Requested", "text.bubble")
        case .merged?: ("Merged", "checkmark.seal.fill")
        case .closed?: ("Closed", "xmark.circle")
        case nil: ("Unknown", "questionmark.circle")
        }
    }
}

/// A pull request submitted from this app: what it said, where it stands and what it changed.
struct PullRequestDetailView: View {
    @Environment(AppModel.self) private var model
    let record: SubmissionRecord

    var body: some View {
        let state = PullRequestState(record.state)
        Form {
            Section {
                LabeledContent("Pull Request", value: "#\(record.id)")
                LabeledContent("State") { Label(state.name, systemImage: state.systemImage) }
                    .accessibilityIdentifier("pull-request-state")
                LabeledContent("Submitted") { Text(record.submitted, format: .dateTime.day().month().year().hour().minute()) }
            } header: {
                Text(record.summary).font(.title2).textSelection(.enabled)
            }
            Section("Changed") {
                ForEach(record.changedFiles, id: \.self) { file in
                    LabeledContent(buildingName(of: file, in: model.buildings)) { Text(file).foregroundStyle(.secondary) }
                }
            }
            Section {
                Link("Open on GitHub", destination: record.submission.url)
            }
        }
        .formStyle(.grouped)
        .accessibilityIdentifier("pull-request-detail")
    }
}
