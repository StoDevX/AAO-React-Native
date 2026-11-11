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

    /// The app serves the data on 8790, which a second copy of the app may hold.
    @Test func saysWhenTheDataPortIsInUse() {
        let control = PreviewControl(.crashed(1), servePortInUse: true)
        #expect(control.title == "Port 8790 is in use")
        #expect(control.offersStartAgain)
    }

    /// The first start downloads Node and ccc-server before anything runs.
    @Test func saysThePreviewIsDownloadingAtItsFirstStart() {
        let control = PreviewControl(.starting, installing: true)
        #expect(control.title == "Downloading preview…")
        #expect(control.click == .showStatus)
        #expect(control.offersStop)
        #expect(!control.offersStartAgain)
    }
}
