import AppKit
import SwiftUI

@main
struct DataEditorApp: App {
    @NSApplicationDelegateAdaptor private var delegate: AppDelegate

    /// Unit tests load the app only to reach its code, so it must not download
    /// the repo or start ccc under them. UI tests launch it without this variable.
    private static let hostsUnitTests = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil

    var body: some Scene {
        WindowGroup("Data Editor") {
            ContentView()
                .environment(delegate.model)
                .task { if !Self.hostsUnitTests { await delegate.model.launch() } }
        }
        Window("Data Browser", id: "browser") {
            DataBrowserView().environment(delegate.model)
        }
    }
}

/// Owns the model, so quitting can wait for it to stop ccc and the helper.
/// Without that wait, ccc's process group keeps port 8787 until the next
/// launch ends it through the pid file.
final class AppDelegate: NSObject, NSApplicationDelegate {
    let model = AppModel()

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        Task {
            await model.shutdown()
            NSApp.reply(toApplicationShouldTerminate: true)
        }
        return .terminateLater
    }
}
