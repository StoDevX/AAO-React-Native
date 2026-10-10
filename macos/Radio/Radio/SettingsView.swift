import SwiftUI

struct SettingsView: View {
    static let showsTitleInMenuBarKey = "showsTitleInMenuBar"

    private enum Tabs: Hashable {
        case general
    }

    @State private var selectedTab: Tabs = .general

    var body: some View {
        TabView(selection: $selectedTab) {
            GeneralSettingsView()
                .tabItem {
                    Label("General", systemImage: "gearshape")
                }
                .tag(Tabs.general)
        }
        .padding(20)
        .frame(width: 450, alignment: .leading)
    }
}

struct GeneralSettingsView: View {
    @AppStorage(SettingsView.showsTitleInMenuBarKey) private var showsTitleInMenuBar = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Section {
                Toggle("Show what's playing next to the icon", isOn: $showsTitleInMenuBar)
            }
            .modifier(PreferencesTabViewModifier(sectionTitle: "Menu Bar"))

            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Listen to KSTO and KRLX from the menu bar.")
                        .font(.callout)
                        .foregroundStyle(.secondary)

                    Text("Version \(NSApplication.appVersion) (\(NSApplication.buildNumber))")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .modifier(PreferencesTabViewModifier(sectionTitle: "About"))
        }
    }
}

#Preview {
    SettingsView()
}
