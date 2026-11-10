import DataEditorKit
import SwiftUI

/// What the Changes sheet's submit button says, and whether it may be clicked.
struct SubmitControl: Equatable {
    let title: String
    let isEnabled: Bool

    /// - Parameters:
    ///   - state: the state of the pull request opened before, if any
    ///   - hasProblems: whether the open file or the last build has problems, which the review would only send back
    init(state: SubmissionState?, hasChanges: Bool, hasConflicts: Bool, hasProblems: Bool) {
        // a merged or closed pull request takes no more commits, so the next submission opens a new one
        title = state == .open || state == .changesRequested ? "Update Pull Request…" : "Submit for Review…"
        isEnabled = hasChanges && !hasConflicts && !hasProblems
    }
}

/// The edited files with their diffs, where the contributor reverts a file,
/// settles a conflict, takes newer data and submits for review.
struct ChangesView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var submitting = false

    var body: some View {
        let control = SubmitControl(state: model.submissionState, hasChanges: !model.changedFiles.isEmpty,
                                    hasConflicts: !model.conflicts.isEmpty,
                                    hasProblems: !model.problems.isEmpty || !model.buildProblems.isEmpty)
        VStack(alignment: .leading) {
            if let submission = model.submission {
                SubmissionBanner(submission: submission)
            }
            if model.newerCommit != nil, model.submissionState != .merged {
                HStack {
                    Label("Newer data is available. Your edits will be kept.", systemImage: "arrow.down.circle")
                    Spacer()
                    Button(model.updating ? "Updating…" : "Update") { Task { await model.updateWorkspace() } }
                        .disabled(model.updating)
                }
                .padding(.horizontal)
            }
            if let updateError = model.updateError {
                HStack {
                    Label("The update failed: \(updateError)", systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.red)
                        .textSelection(.enabled)
                    Spacer()
                    Button("Dismiss", systemImage: "xmark") { model.dismissUpdateError() }
                        .labelStyle(.iconOnly)
                        .buttonStyle(.borderless)
                        .accessibilityLabel("Dismiss the update error")
                }
                .padding(.horizontal)
            }
            ForEach(model.conflicts, id: \.self) { file in
                HStack {
                    Label("\(file) changed on GitHub too. Which version should stay?", systemImage: "exclamationmark.2")
                    Spacer()
                    Button("Mine") { Task { await model.keepMine(file) } }
                    Button("GitHub's") { Task { await model.keepLatest(file) } }
                }
                .padding(.horizontal)
            }
            if model.changedFiles.isEmpty {
                ContentUnavailableView("No changes yet", systemImage: "checkmark.circle")
            } else {
                List {
                    ForEach(model.changedFiles, id: \.self) { file in
                        Section {
                            DiffView(lines: model.diff(for: file))
                        } header: {
                            HStack {
                                Text(file)
                                Spacer()
                                Button("Revert", role: .destructive) { Task { await model.revert(file) } }
                                    .accessibilityIdentifier("revert-\(file)")
                            }
                        }
                    }
                }
            }
            HStack {
                Button("Close") { dismiss() }.keyboardShortcut(.cancelAction)
                Spacer()
                Button(control.title) { submitting = true }
                    .disabled(!control.isEnabled)
                    .keyboardShortcut(.defaultAction)
            }
            .padding()
        }
        .frame(minWidth: 640, minHeight: 480)
        .sheet(isPresented: $submitting) { SubmitSheet() }
        .task { await model.refreshSubmission() }
    }
}

/// A file's changed lines, each prefixed `+ ` or `- ` before the file's own indentation.
private struct DiffView: View {
    let lines: [DiffLine]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                if line.kind != .same {
                    Text((line.kind == .added ? "+ " : "- ") + line.text)
                        .font(.body.monospaced())
                        .foregroundStyle(line.kind == .added ? .green : .red)
                        .textSelection(.enabled)
                }
            }
        }
    }
}

/// Where the pull request opened before stands, with what to do next.
private struct SubmissionBanner: View {
    @Environment(AppModel.self) private var model
    let submission: Submission

    var body: some View {
        HStack {
            switch model.submissionState {
            case .merged?:
                Label("Pull request #\(submission.number) was merged.", systemImage: "checkmark.seal.fill").foregroundStyle(.green)
                Spacer()
                Button("Get the Latest Data") { Task { await model.updateWorkspace() } }
            case .changesRequested?:
                Label("A reviewer asked for changes on #\(submission.number).", systemImage: "text.bubble")
                Spacer()
                Link("Read the review", destination: submission.url)
            case .closed?:
                Label("Pull request #\(submission.number) was closed without merging.", systemImage: "xmark.circle")
                Spacer()
                Link("See why", destination: submission.url)
            case .open?, nil:
                Label("Pull request #\(submission.number) is waiting for review.", systemImage: "clock")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            }
        }
        .padding()
    }
}
