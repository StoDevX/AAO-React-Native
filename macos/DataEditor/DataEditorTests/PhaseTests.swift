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
}
