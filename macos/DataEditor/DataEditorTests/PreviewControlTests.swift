import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct PreviewControlTests {
    @Test func offersToStartThePreviewWhileItIsOff() {
        let control = PreviewControl(.stopped)
        #expect(control.title == "Start Preview")
        #expect(control.click == .start)
        #expect(!control.offersStop)
        #expect(!control.offersStartAgain)
    }

    @Test func showsTheStatusAndOffersToStopWhileStartingOrRunning() {
        for status: CccRunner.Status in [.starting, .running] {
            let control = PreviewControl(status)
            #expect(control.click == .showStatus)
            #expect(control.offersStop)
            #expect(!control.offersStartAgain)
        }
        #expect(PreviewControl(.starting).title == "Starting preview…")
        #expect(PreviewControl(.running).title == "Preview on")
    }

    @Test func offersToStartAgainOnceThePreviewFailed() {
        for status: CccRunner.Status in [.portInUse, .crashed(1)] {
            let control = PreviewControl(status)
            #expect(control.click == .showStatus)
            #expect(control.offersStop)
            #expect(control.offersStartAgain)
        }
        #expect(PreviewControl(.portInUse).title == "Port 8787 is in use")
        #expect(PreviewControl(.crashed(1)).title == "Preview stopped")
    }
}
