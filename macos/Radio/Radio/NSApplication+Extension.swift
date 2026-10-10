import SwiftUI

enum PlistKey: String {
    case Build = "CFBundleVersion"
    case Name = "CFBundleName"
    case Version = "CFBundleShortVersionString"
}

extension NSApplication {
    // MARK: Build info

    static var appVersion: String {
        return Bundle.main.object(forInfoDictionaryKey: PlistKey.Version.rawValue) as? String ?? ""
    }

    static var buildNumber: String {
        return Bundle.main.object(forInfoDictionaryKey: PlistKey.Build.rawValue) as? String ?? ""
    }

    static var bundleName: String {
        return Bundle.main.object(forInfoDictionaryKey: PlistKey.Name.rawValue) as? String ?? ""
    }

    // MARK: Dock icon and windows

    /// Puts the app in the Dock and the menu bar, so its Settings window and
    /// menus can come to the front. The app otherwise lives in the menu bar only.
    static func showInDock() {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate()
    }

    static func hideFromDock() {
        NSApp.setActivationPolicy(.accessory)
    }

    static func showAboutPanel() {
        let year = Calendar(identifier: .gregorian).component(.year, from: Date())
        NSApp.activate()
        NSApp.orderFrontStandardAboutPanel(options: [
            .credits: NSAttributedString(
                string: "KSTO and KRLX, from the menu bar.",
                attributes: [.font: NSFont.systemFont(ofSize: NSFont.smallSystemFontSize, weight: .regular)]
            ),
            NSApplication.AboutPanelOptionKey(rawValue: "Copyright"): "© \(year)",
        ])
    }
}
