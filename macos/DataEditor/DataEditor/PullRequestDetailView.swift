import DataEditorKit
import SwiftUI

/// A pull request's state as its row and its Overview name it.
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

/// A submitted pull request's Overview: what it said, where it stands, and
/// each changed building's diff, read only.
struct PullRequestDetailView: View {
    @Environment(AppModel.self) private var model
    let number: Int

    var body: some View {
        if let record = model.submissions.records.first(where: { $0.id == number }) {
            let state = PullRequestState(record.state)
            Form {
                Section {
                    LabeledContent("Pull Request", value: "#\(String(record.id))")
                    LabeledContent("State") { Label(state.name, systemImage: state.systemImage) }
                        .accessibilityIdentifier("pull-request-state")
                    LabeledContent("Submitted") { Text(record.submitted, format: .dateTime.day().month().year().hour().minute()) }
                    Link("Open on GitHub", destination: record.submission.url)
                } header: {
                    Text(record.summary).font(.title2).textSelection(.enabled)
                }
                PullRequestLoadStatus(record: record)
                ForEach(record.diffs.map { Array($0.keys).sorted() } ?? [], id: \.self) { file in
                    Section(buildingName(of: file, in: model.buildings)) {
                        PullRequestFileDiff(record: record, file: file)
                    }
                }
            }
            .formStyle(.grouped)
            .accessibilityIdentifier("pull-request-detail")
            .task(id: number) { await model.loadDiffs(of: number) }
        } else {
            ContentUnavailableView("No pull request", systemImage: "questionmark.circle")
        }
    }
}

/// One file of a submitted pull request, read only.
struct PullRequestFileView: View {
    @Environment(AppModel.self) private var model
    let number: Int
    let file: String

    var body: some View {
        if let record = model.submissions.records.first(where: { $0.id == number }) {
            Form {
                Section {
                    PullRequestFileDiff(record: record, file: file)
                } header: {
                    VStack(alignment: .leading) {
                        Text(buildingName(of: file, in: model.buildings)).font(.title2)
                        Text(file).font(.caption).foregroundStyle(.secondary)
                    }
                }
                PullRequestLoadStatus(record: record)
            }
            .formStyle(.grouped)
            .accessibilityIdentifier("pull-request-file")
            .task(id: number) { await model.loadDiffs(of: number) }
        }
    }
}

/// A file's diff as the pull request keeps it, or why it is not shown.
private struct PullRequestFileDiff: View {
    let record: SubmissionRecord
    let file: String

    var body: some View {
        if record.tooLarge.contains(file) {
            HStack {
                Text("Too large to show here")
                Spacer()
                Link("Open on GitHub", destination: record.submission.url)
            }
        } else if let rows = record.diffs?[file] {
            DiffView(rows: rows)
        } else {
            Text("No changes kept for this file")
                .foregroundStyle(.secondary)
        }
    }
}

/// How the shown diffs stand against GitHub's: loading, last checked, gone, or not loaded at all.
private struct PullRequestLoadStatus: View {
    @Environment(AppModel.self) private var model
    let record: SubmissionRecord

    var body: some View {
        switch model.diffLoad[record.id] {
        case .loading? where record.diffs == nil:
            Section { ProgressView().frame(maxWidth: .infinity) }
        case .failed? where record.diffs == nil:
            Section {
                HStack {
                    Text("Couldn't load this pull request's changes.")
                    Spacer()
                    Button("Try Again") { Task { await model.loadDiffs(of: record.id) } }
                }
            }
        case .failed?:
            Section {
                if let checked = record.checked {
                    Text("Last checked \(checked, format: .dateTime.day().month().year().hour().minute())")
                } else {
                    Text("Last checked when you submitted it")
                }
            }
            .foregroundStyle(.secondary)
        case .gone?:
            Section {
                HStack {
                    Text("This pull request no longer exists on GitHub.")
                    Spacer()
                    Button("Forget This Pull Request") { model.forgetSubmission(record.id) }
                }
            }
        case .loading?, nil:
            EmptyView()
        }
    }
}
