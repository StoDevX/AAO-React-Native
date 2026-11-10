import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct DataBrowserTests {
    @Test func asksTheLocalWorkerOnlyWhileThePreviewRuns() {
        #expect(DataBrowserView.localURL(for: "spaces/hours", status: .running) == cccLocalBase.appending(path: "spaces/hours"))
        for status: CccRunner.Status in [.stopped, .starting, .portInUse, .crashed(1)] {
            #expect(DataBrowserView.localURL(for: "spaces/hours", status: status) == nil)
        }
    }

    @Test func trimsSlashesAndSpacesFromTheRoute() {
        #expect(DataBrowserView.routePath(" /spaces/hours/ ") == "spaces/hours")
    }
}
