import DataEditorKit
import SwiftUI

/// What the Changes sheet's submit button says, whether it may be clicked, and why not.
struct SubmitControl: Equatable {
    let title: String
    let isEnabled: Bool
    /// Why the button is disabled, when the sheet does not already show it.
    let reason: String?

    /// - Parameters:
    ///   - hasSubmission: whether a pull request was opened before
    ///   - state: that pull request's state, nil while unknown
    ///   - hasProblems: whether the open file or the last build has problems, which the review would only send back
    init(hasSubmission: Bool, state: SubmissionState?, hasChanges: Bool, hasConflicts: Bool, hasProblems: Bool) {
        // a pull request whose state is unknown may still be open; submitting checks before choosing
        let updates = hasSubmission && !(state.map(AppModel.opensNewPullRequest(after:)) ?? false)
        title = updates ? "Update Pull Request…" : "Submit for Review…"
        isEnabled = hasChanges && !hasConflicts && !hasProblems
        reason = if !hasChanges {
            // the empty list says so
            nil
        } else if hasConflicts {
            "Choose which copy to keep of each conflicting file before submitting."
        } else if hasProblems {
            "Fix the problems the editor lists before submitting."
        } else {
            nil
        }
    }
}

/// A row of a file's diff: a line, or the unchanged lines left out between two changes.
enum DiffRow: Hashable {
    case line(DiffLine)
    case gap
}

/// The changed lines of a diff with up to `context` unchanged lines around
/// each, so a reader can tell which service a line belongs to.
func diffRows(_ lines: [DiffLine], context: Int = 2) -> [DiffRow] {
    var kept = Set<Int>()
    for index in lines.indices where lines[index].kind != .same {
        kept.formUnion(max(0, index - context)...min(lines.count - 1, index + context))
    }
    var rows: [DiffRow] = []
    var previous: Int?
    for index in kept.sorted() {
        if let previous, index > previous + 1 { rows.append(.gap) }
        rows.append(.line(lines[index]))
        previous = index
    }
    return rows
}

/// The edited files with their diffs, where the contributor reverts a file,
/// settles a conflict, takes newer data and submits for review.
struct ChangesView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var submitting = false
    /// The file whose Revert waits for the contributor to confirm it.
    @State private var reverting: String?

    /// The question that confirms a revert, naming the building where its file is known.
    static func revertQuestion(file: String, name: String?) -> String {
        "Revert \(name ?? file)?"
    }

    var body: some View {
        let control = SubmitControl(hasSubmission: model.submission != nil, state: model.submissionState,
                                    hasChanges: !model.changedFiles.isEmpty, hasConflicts: !model.conflicts.isEmpty,
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
                        .accessibilityLabel("Keep my version of \(file)")
                    Button("GitHub's") { Task { await model.keepLatest(file) } }
                        .accessibilityLabel("Keep GitHub's version of \(file)")
                }
                .padding(.horizontal)
            }
            if model.changedFiles.isEmpty {
                ContentUnavailableView("No changes yet", systemImage: "checkmark.circle")
            } else {
                List {
                    ForEach(model.changedFiles, id: \.self) { file in
                        Section {
                            DiffView(rows: diffRows(model.diff(for: file)))
                        } header: {
                            HStack {
                                Text(file)
                                Spacer()
                                Button("Revert", role: .destructive) { reverting = file }
                                    .accessibilityLabel("Revert \(file)")
                                    .accessibilityIdentifier("revert-\(file)")
                            }
                        }
                    }
                }
            }
            HStack {
                Button("Close") { dismiss() }.keyboardShortcut(.cancelAction)
                Spacer()
                if !control.isEnabled, let reason = control.reason {
                    Text(reason).foregroundStyle(.secondary)
                }
                Button(control.title) { submitting = true }
                    .disabled(!control.isEnabled)
                    .keyboardShortcut(.defaultAction)
            }
            .padding()
        }
        .frame(minWidth: 640, minHeight: 480)
        .confirmationDialog(
            reverting.map { file in Self.revertQuestion(file: file, name: model.buildings.first { $0.file == file }?.name) } ?? "",
            isPresented: Binding(get: { reverting != nil }, set: { if !$0 { reverting = nil } }),
            titleVisibility: .visible,
            presenting: reverting
        ) { file in
            Button("Revert", role: .destructive) { Task { await model.revert(file) } }
                .accessibilityIdentifier("confirm-revert")
        } message: { _ in
            Text("Your changes to this file will be lost.")
        }
        .sheet(isPresented: $submitting) { SubmitSheet() }
        .task { await model.refreshSubmission() }
    }
}

/// A file's diff rows: changed lines prefixed `+ ` or `- `, unchanged ones
/// two spaces, each before the file's own indentation.
private struct DiffView: View {
    let rows: [DiffRow]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                switch row {
                case .gap:
                    Text("⋯").font(.body.monospaced()).foregroundStyle(.secondary)
                        .accessibilityLabel("Unchanged lines left out")
                case .line(let line):
                    Text(Self.prefix(line.kind) + line.text)
                        .font(.body.monospaced())
                        .foregroundStyle(Self.color(line.kind))
                        .textSelection(.enabled)
                }
            }
        }
    }

    private static func prefix(_ kind: DiffLine.Kind) -> String {
        switch kind {
        case .added: "+ "
        case .removed: "- "
        case .same: "  "
        }
    }

    private static func color(_ kind: DiffLine.Kind) -> Color {
        switch kind {
        case .added: .green
        case .removed: .red
        case .same: .secondary
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
            case .open?:
                Label("Pull request #\(submission.number) is waiting for review.", systemImage: "clock")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            case nil:
                Label("Could not check pull request #\(submission.number) on GitHub.", systemImage: "questionmark.circle")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            }
        }
        .padding()
    }
}
