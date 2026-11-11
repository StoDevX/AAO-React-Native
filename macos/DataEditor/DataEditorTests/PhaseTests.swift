import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct PhaseTests {
    @Test func launchesBeforeTheFirstLaunchAndAfterAFailure() {
        #expect(AppModel.Phase.starting.allowsLaunch)
        #expect(AppModel.Phase.failed("offline").allowsLaunch)
    }

    @Test func doesNotLaunchASecondTimeOnceStartedOrReady() {
        #expect(!AppModel.Phase.downloading.allowsLaunch)
        #expect(!AppModel.Phase.ready.allowsLaunch)
        #expect(!AppModel.Phase.needsAppUpdate.allowsLaunch)
    }

    /// Every edit fails once the helper has gone, so the window offers Try Again.
    @Test func failsWhenTheHelperStops() {
        #expect(AppModel.failurePhase(after: HelperClient.Failure(message: "The helper stopped")) == .failed(AppModel.helperStoppedMessage))
        #expect(AppModel.failurePhase(after: HelperClient.Failure(message: "The helper stopped: Bad file descriptor")) == .failed(AppModel.helperStoppedMessage))
        // a refused edit leaves the helper running
        #expect(AppModel.failurePhase(after: HelperClient.Failure(message: "x is outside the workspace")) == nil)
    }
}
