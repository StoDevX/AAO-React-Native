import AppKit
import SwiftUI

@main
struct DataEditorApp: App {
    @NSApplicationDelegateAdaptor private var delegate: AppDelegate

    var body: some Scene {
        WindowGroup("Data Editor") {
            ContentView().environment(delegate.model)
        }
        Window("Data Browser", id: "browser") {
            DataBrowserView().environment(delegate.model)
        }
    }
}

/// Owns the model, launches it once per run of the app however many windows
/// open, and makes quitting wait for it to stop ccc and the helper. Without
/// that wait, ccc's process group keeps port 8787 until the next launch ends
/// it through the pid file.
final class AppDelegate: NSObject, NSApplicationDelegate {
    let model = AppModel()

    /// Unit tests load the app only to reach its code, so it must not download
    /// the repo or start ccc under them. UI tests launch it without this variable.
    private let hostsUnitTests = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard !hostsUnitTests else { return }
        Task { await model.launch() }
    }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        Task {
            await model.shutdown()
            NSApp.reply(toApplicationShouldTerminate: true)
        }
        return .terminateLater
    }
}
