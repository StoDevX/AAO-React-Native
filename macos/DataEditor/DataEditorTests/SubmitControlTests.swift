import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct SubmitControlTests {
    private func control(state: SubmissionState? = nil, changes: Bool = true, conflicts: Bool = false, problems: Bool = false) -> SubmitControl {
        SubmitControl(state: state, hasChanges: changes, hasConflicts: conflicts, hasProblems: problems)
    }

    @Test func offersANewPullRequestUnlessOneIsStillOpen() {
        for state: SubmissionState? in [nil, .merged, .closed] {
            #expect(control(state: state).title == "Submit for Review…")
        }
        for state: SubmissionState in [.open, .changesRequested] {
            #expect(control(state: state).title == "Update Pull Request…")
        }
    }

    @Test func isEnabledOnlyWithChangesAndNothingInTheWay() {
        #expect(control().isEnabled)
        #expect(!control(changes: false).isEnabled)
        #expect(!control(conflicts: true).isEnabled)
        #expect(!control(problems: true).isEnabled)
    }

    @Test func theSheetSubmitsOnlyASummaryWithASignInAndNothingUnderWay() {
        #expect(SubmitSheet.canSubmit(summary: "Close at 9", working: false, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: " \n ", working: false, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: "Close at 9", working: true, clientID: "abc"))
        #expect(!SubmitSheet.canSubmit(summary: "Close at 9", working: false, clientID: ""))
    }
}
