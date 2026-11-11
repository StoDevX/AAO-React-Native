import AppKit
import SwiftUI

@main
struct DataEditorApp: App {
    @NSApplicationDelegateAdaptor private var delegate: AppDelegate

    var body: some Scene {
        // first, so it is the window the app opens with
        Window("Changesets", id: "changesets") {
            ChangesetsWindow().environment(delegate.model)
        }
        .keyboardShortcut("0")
        // opens at every launch, even when it was closed at the last quit and others are restored
        .defaultLaunchBehavior(.presented)
        WindowGroup("Changeset", for: Changeset.self) { $changeset in
            ChangesetWindow(changeset: changeset ?? .current).environment(delegate.model)
        }
        // a changeset opens from the Changesets window; New Window would make a second Current changes
        .commands { CommandGroup(replacing: .newItem) {} }
        Window("Data Browser", id: "browser") {
            DataBrowserView().environment(delegate.model)
        }
    }
}

/// Owns the model, launches it once per run of the app however many windows
/// open, and makes quitting wait for it to save what is typed and stop ccc and
/// the helper. Without that wait, the typed text is lost, and ccc's process
/// group keeps port 8787 until the next launch ends it through the pid file.
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
