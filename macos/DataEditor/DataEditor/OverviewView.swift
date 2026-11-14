import DataEditorKit
import SwiftUI

/// What the Overview's submit button says, whether it may be clicked, and why not.
struct SubmitControl: Equatable {
    let title: String
    let isEnabled: Bool
    /// Why the button is disabled, when the Overview does not already show it.
    let reason: String?

    /// - Parameters:
    ///   - hasSubmission: whether a pull request was opened before
    ///   - state: that pull request's state, nil while unknown
    ///   - hasProblems: whether any file or the last build has problems, which the review would only send
    ///     back; the Overview lists them above the button
    init(hasSubmission: Bool, state: SubmissionState?, hasChanges: Bool, hasConflicts: Bool, hasProblems: Bool) {
        // a pull request whose state is unknown may still be open; submitting checks before choosing
        let updates = hasSubmission && !(state.map(AppModel.opensNewPullRequest(after:)) ?? false)
        title = updates ? "Update Pull Request…" : "Submit for Review…"
        isEnabled = hasChanges && !hasConflicts && !hasProblems
        reason = if hasConflicts {
            // a conflict alone is a change the page shows, so it needs its reason
            "Choose which copy to keep of each conflicting file before submitting."
        } else if !hasChanges {
            // the page says "No changes"
            nil
        } else if hasProblems {
            "Fix the problems listed above before submitting."
        } else {
            nil
        }
    }
}

/// Everything about Current changes in one place: the pull request, newer
/// data, conflicts, the preview, problems, each changed building's diff, and Submit.
struct OverviewView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @Environment(\.appearsActive) private var appearsActive
    /// Whether this page sits outside the editor, so an empty page offers the way in.
    let offersEditor: Bool
    @State private var submitting = false
    /// The file whose Revert waits for the contributor to confirm it.
    @State private var reverting: String?
    @State private var discardingAll = false

    /// The question that confirms a revert, naming the building where its file is known.
    static func revertQuestion(file: String, name: String?) -> String {
        "Revert \(name ?? file)?"
    }

    var body: some View {
        let parts = model.overviewParts
        let control = SubmitControl(hasSubmission: model.currentSubmission != nil, state: model.currentSubmission?.state,
                                    hasChanges: !parts.changed.isEmpty, hasConflicts: !parts.conflicts.isEmpty,
                                    hasProblems: !parts.problems.isEmpty)
        Form {
            if let record = parts.pullRequest {
                Section { SubmissionBanner(record: record) }
                    .accessibilityIdentifier("overview-pull-request")
            }
            if parts.newerData || model.updateError != nil {
                Section { newerData }
                    .accessibilityIdentifier("overview-newer-data")
            }
            if parts.isEmpty {
                Section {
                    ContentUnavailableView {
                        Label("No changes", systemImage: "checkmark.circle")
                    } actions: {
                        if offersEditor {
                            Button("Edit Data") { openWindow(value: Changeset.current) }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                ForEach(parts.conflicts, id: \.self) { file in
                    Section { ConflictRow(file: file) }
                }
            }
            if let preview = parts.preview {
                Section { previewLine(preview) }
                    .accessibilityIdentifier("overview-preview")
            }
            if !parts.problems.isEmpty {
                Section("Problems") {
                    ForEach(Array(plainProblems(parts.problems).enumerated()), id: \.offset) { _, problem in
                        problemRow(problem)
                    }
                }
                .accessibilityIdentifier("overview-problems")
            }
            ForEach(parts.changed, id: \.self) { file in
                Section {
                    DiffView(rows: diffRows(model.diff(for: file)))
                } header: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(model.name(of: file))
                            Text(file).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button("Revert", role: .destructive) { reverting = file }
                            .accessibilityLabel("Revert \(model.name(of: file))")
                            .accessibilityIdentifier("revert-\(file)")
                    }
                }
            }
        }
        .formStyle(.grouped)
        .safeAreaInset(edge: .bottom) {
            HStack {
                if !control.isEnabled, let reason = control.reason {
                    Text(reason).foregroundStyle(.secondary)
                }
                Spacer()
                if !parts.isEmpty {
                    Button("Discard All Changes…", role: .destructive) { discardingAll = true }
                }
                // no Return key: in the Changesets window Return opens the chosen changeset
                Button(control.title) { submitting = true }
                    .disabled(!control.isEnabled)
            }
            .padding()
            .background(.bar)
        }
        .accessibilityIdentifier("overview-page")
        .confirmationDialog(
            reverting.map { file in Self.revertQuestion(file: file, name: model.name(of: file)) } ?? "",
            isPresented: Binding(get: { reverting != nil }, set: { if !$0 { reverting = nil } }),
            titleVisibility: .visible,
            presenting: reverting
        ) { file in
            Button("Revert", role: .destructive) { Task { await model.revert(file) } }
                .accessibilityIdentifier("confirm-revert")
        } message: { _ in
            Text("Your changes to this file will be lost.")
        }
        .confirmationDialog("Discard all changes?", isPresented: $discardingAll, titleVisibility: .visible) {
            Button("Discard All Changes", role: .destructive) { Task { await model.discardAll() } }
                .accessibilityIdentifier("confirm-discard-all")
        } message: {
            Text(model.currentSubmission == nil
                ? "Your changes to every building will be lost."
                : "Your changes to every building will be lost. The pull request stays on GitHub.")
        }
        .sheet(isPresented: $submitting) { SubmitSheet() }
        .task {
            // text still being typed in the Current changes window belongs in this page and its Submit
            _ = await model.commitPendingDrafts()
            await model.refreshSubmissions()
            await model.refreshNewerCommit()
        }
        // the page stays on screen, so it looks again each time its window comes forward
        .onChange(of: appearsActive) { _, active in
            guard active else { return }
            Task {
                _ = await model.commitPendingDrafts()
                await model.refreshSubmissions()
                await model.refreshNewerCommit()
            }
        }
    }

    @ViewBuilder private var newerData: some View {
        if model.newerCommit != nil {
            HStack {
                Label("Newer data is available. Your edits will be kept.", systemImage: "arrow.down.circle")
                Spacer()
                Button(model.updating ? "Updating…" : "Get the Latest Data") { Task { await model.updateWorkspace() } }
                    .disabled(model.updating)
            }
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
        }
    }

    @ViewBuilder private func previewLine(_ preview: PreviewLine) -> some View {
        HStack {
            Label(preview.text(name: model.name(of:)),
                  systemImage: preview == .upToDate ? "iphone" : "exclamationmark.triangle.fill")
            Spacer()
            if case .stopsAt(let file) = preview {
                Button("Show \(model.name(of: file))") { show(file) }
            }
        }
    }

    /// Opens `file` for editing in the Current changes window, from whichever window this page is in.
    private func show(_ file: String) {
        openWindow(value: Changeset.current)
        Task { await model.choose(model.item(showing: file)) }
    }

    /// A problem that names its building opens it; one that names none only reads.
    @ViewBuilder private func problemRow(_ problem: Problem) -> some View {
        let label = ProblemLabel(problem: problem, fileOnScreen: nil, systemImage: "exclamationmark.triangle.fill")
        if let file = problem.file {
            Button { show(file) } label: { label }
                .buttonStyle(.plain)
        } else {
            label
        }
    }
}

/// Where the newest pull request stands, with what to do next.
private struct SubmissionBanner: View {
    @Environment(AppModel.self) private var model
    let record: SubmissionRecord
    private var submission: Submission { record.submission }
    /// The number as GitHub writes it: a number in a label's text would be grouped, as in #8,123.
    private var number: String { String(submission.number) }

    /// What the banner says. A failed check comes first: the state on record may no longer be true.
    private enum Standing { case gone, unchecked, changesRequested, open, merged, closed }

    private var standing: Standing {
        if model.submissionUnreadable { return .gone }
        if model.checkFailures.unanswered.contains(record.id) { return .unchecked }
        switch record.state {
        case .changesRequested?: return .changesRequested
        case .open?: return .open
        case .merged?: return .merged
        case .closed?: return .closed
        case nil: return .unchecked
        }
    }

    var body: some View {
        HStack {
            switch standing {
            case .changesRequested:
                Label("A reviewer asked for changes on #\(number).", systemImage: "text.bubble")
                Spacer()
                Link("Read the review", destination: submission.url)
            case .open:
                Label("Pull request #\(number) is waiting for review.", systemImage: "clock")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            case .merged, .closed:
                Label(standing == .merged ? "Pull request #\(number) was merged." : "Pull request #\(number) was closed.",
                      systemImage: standing == .merged ? "checkmark.seal.fill" : "xmark.circle")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
                Button(model.updating ? "Updating…" : "Get the Latest Data") { Task { await model.updateWorkspace() } }
                    .disabled(model.updating)
            case .gone:
                Label("Pull request #\(number) no longer exists on GitHub.", systemImage: "questionmark.circle")
                Spacer()
                // every submission asks after it first, so it would stop each one
                Button("Forget This Pull Request") { model.forgetSubmission(submission.number) }
            case .unchecked:
                Label("Could not check pull request #\(number) on GitHub.", systemImage: "questionmark.circle")
                Spacer()
                Link("Open on GitHub", destination: submission.url)
            }
        }
    }
}
