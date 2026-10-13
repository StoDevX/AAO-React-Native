import SwiftUI

/// The app menu bar's About and Help menus, which show while Settings is open.
struct RadioCommands: Commands {
    @SwiftUI.Environment(\.openURL) var openURL: OpenURLAction

    private static let issuesURL = URL(string: "https://github.com/StoDevX/AAO-React-Native/issues")!

    var body: some Commands {
        CommandGroup(replacing: .appInfo) {
            Button("About \(NSApplication.bundleName)") {
                NSApplication.showAboutPanel()
            }
        }

        CommandGroup(replacing: .help) {
            ForEach(Station.allCases) { station in
                Button("\(station.name) Website") {
                    openURL(station.websiteURL)
                }
            }

            Divider()

            Button("Report a Bug") {
                openURL(Self.issuesURL)
            }
        }
    }
}
