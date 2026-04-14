import ComposableArchitecture
import SwiftUI

@main
struct AllAboutAnythingApp: App {
	// NB: Static to avoid interference with Xcode previews, which re-create the entry point.
	static let store = Store(initialState: AppFeature.State()) {
		AppFeature()
	}

	var body: some Scene {
		WindowGroup {
			// NB: Don't run the application in tests to avoid interference with the test suite.
			if isTesting {
				EmptyView()
			} else {
				AppView(store: Self.store)
			}
		}
	}
}

struct AppView: View {
	@Bindable var store: StoreOf<AppFeature>

	var body: some View {
		NavigationStack(path: $store.scope(state: \.path, action: \.path)) {
			HomeGridView(store: store.scope(state: \.home, action: \.home))
		} destination: { store in
			switch store.case {
			case let .placeholder(store):
				PlaceholderView(store: store)
			case let .browser(store):
				SafariBrowserView(url: store.url)
					.ignoresSafeArea()
					.navigationBarBackButtonHidden(true)
			}
		}
	}
}
