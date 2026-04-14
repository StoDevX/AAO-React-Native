import ComposableArchitecture
import SwiftUI

struct SettingsView: View {
	let store: StoreOf<SettingsFeature>

	var body: some View {
		ContentUnavailableView(
			"Settings",
			systemImage: "gear",
			description: Text("Coming soon")
		)
		.navigationTitle("Settings")
		.navigationBarTitleDisplayMode(.inline)
	}
}
