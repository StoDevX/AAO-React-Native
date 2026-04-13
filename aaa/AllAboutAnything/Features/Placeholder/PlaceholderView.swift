import ComposableArchitecture
import SwiftUI

struct PlaceholderView: View {
	let store: StoreOf<PlaceholderFeature>

	var body: some View {
		VStack(spacing: 24) {
			Image(systemName: store.sfSymbol)
				.font(.system(size: 64))
				.foregroundStyle(Color(hex: store.tintColor))

			Text(store.title)
				.font(.title)
				.fontWeight(.semibold)

			Text("Coming Soon")
				.font(.subheadline)
				.foregroundStyle(.secondary)
		}
		.navigationTitle(store.title)
		.navigationBarTitleDisplayMode(.inline)
	}
}
