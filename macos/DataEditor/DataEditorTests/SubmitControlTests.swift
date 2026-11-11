import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SubmitControlTests {
    private func control(submission: Bool = false, state: SubmissionState? = nil, changes: Bool = true,
                         conflicts: Bool = false, problems: Bool = false) -> SubmitControl {
        SubmitControl(hasSubmission: submission, state: state, hasChanges: changes, hasConflicts: conflicts, hasProblems: problems)
    }

    @Test func offersANewPullRequestWhenThereIsNoneOrItIsFinished() {
        #expect(control().title == "Submit for Review…")
        for state: SubmissionState in [.merged, .closed] {
            #expect(control(submission: true, state: state).title == "Submit for Review…")
        }
    }

    @Test func offersAnUpdateWhileThePullRequestIsOpenOrItsStateIsUnknown() {
        for state: SubmissionState? in [.open, .changesRequested, nil] {
            #expect(control(submission: true, state: state).title == "Update Pull Request…")
        }
    }

    @Test func isEnabledOnlyWithChangesAndNothingInTheWay() {
        #expect(control().isEnabled)
        #expect(!control(changes: false).isEnabled)
        #expect(!control(conflicts: true).isEnabled)
        #expect(!control(problems: true).isEnabled)
    }

    @Test func saysWhyItIsDisabled() {
        #expect(control().reason == nil)
        // the empty list already says there is nothing to submit
        #expect(control(changes: false).reason == nil)
        #expect(control(conflicts: true).reason == "Choose which copy to keep of each conflicting file before submitting.")
        #expect(control(problems: true).reason == "Fix the problems listed above before submitting.")
        // a conflict counts as a change, so the page shows it rather than "No changes"
        #expect(control(changes: false, conflicts: true).reason == "Choose which copy to keep of each conflicting file before submitting.")
    }

    /// Each window's Overview has its own Submit, and two submissions at once could open two pull requests.
    @Test func refusesASecondSubmissionWhileOneRuns() {
        #expect(AppModel.submitRefusal(updating: false, submitting: true) == .submitting)
        #expect(AppModel.submitRefusal(updating: true, submitting: false) == .updating)
        #expect(AppModel.submitRefusal(updating: false, submitting: false) == nil)
    }

    @Test func aFinishedPullRequestTakesNoMoreCommits() {
        #expect(AppModel.opensNewPullRequest(after: .merged))
        #expect(AppModel.opensNewPullRequest(after: .closed))
        #expect(!AppModel.opensNewPullRequest(after: .open))
        #expect(!AppModel.opensNewPullRequest(after: .changesRequested))
    }

    @Test func theSheetSubmitsOnlyASummaryWithASignInAndNothingUnderWay() {
        #expect(SubmitSheet.canSubmit(summary: "Close at 9", working: false, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: " \n ", working: false, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: "Close at 9", working: true, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: "Close at 9", working: false, clientID: ""))
    }

    /// A pull request GitHub will not show may be gone for good, and while it
    /// is remembered every submission asks after it first.
    @Test func offersToForgetAPullRequestGitHubWillNotShow() {
        #expect(CheckFailures.isUnreadable(SubmitError.github(404, "Not Found")))
        #expect(CheckFailures.isUnreadable(SubmitError.github(410, "Gone")))
        // a public pull request answers 403 only when GitHub is rate limiting, and it still exists
        #expect(!CheckFailures.isUnreadable(SubmitError.github(403, "API rate limit exceeded for user ID 1.")))
        #expect(!CheckFailures.isUnreadable(SubmitError.github(403, "You have exceeded a secondary rate limit.")))
        #expect(!CheckFailures.isUnreadable(SubmitError.github(403, "Forbidden")))
        #expect(!CheckFailures.isUnreadable(SubmitError.github(500, "")))
        #expect(!CheckFailures.isUnreadable(SubmitError.signInRequired))
        #expect(!CheckFailures.isUnreadable(URLError(.notConnectedToInternet)))
    }
}
