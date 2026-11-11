import Testing
import DataEditorKit

struct SubmissionStateTests {
    /// A merged or closed pull request takes no more commits.
    @Test func isFinishedOnceMergedOrClosed() {
        #expect(SubmissionState.merged.isFinished)
        #expect(SubmissionState.closed.isFinished)
        #expect(!SubmissionState.open.isFinished)
        #expect(!SubmissionState.changesRequested.isFinished)
    }
}
