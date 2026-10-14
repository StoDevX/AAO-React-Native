import SwiftUI

@main
struct RadioMenuBarApp: App {
    @State private var radioManager: RadioManager
    @AppStorage(SettingsView.showsTitleInMenuBarKey) private var showsTitleInMenuBar = false

    /// The menu bar has room for a short title only.
    private static let menuBarTitleLength = 32

    init() {
        let sources = StationSourcesStore()
        _radioManager = State(initialValue: RadioManager(sources: sources))
        // Once a launch: a station's address changes rarely, so a new one can wait for the next.
        Task { await sources.refresh() }
    }

    var body: some Scene {
        MenuBarExtra {
            RadioView(manager: radioManager)
        } label: {
            Image(nsImage: MenuBarLabel.image(title: menuBarTitle))
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView()
                .onDisappear { NSApplication.hideFromDock() }
        }
        .commands {
            RadioCommands()
        }
    }

    /// Empty, for the icon alone, unless the title is wanted and something is playing.
    private var menuBarTitle: String {
        guard showsTitleInMenuBar && radioManager.isPlaying else { return "" }
        let title = radioManager.nowPlaying.title
        return title.count > Self.menuBarTitleLength ? title.prefix(Self.menuBarTitleLength - 1) + "…" : title
    }
}
