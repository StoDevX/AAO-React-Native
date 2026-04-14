import ComposableArchitecture
import Testing
@testable import AllAboutAnything

@MainActor
@Test func itemTappedPushesPlaceholder() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)

	var homeState = HomeFeature.State()
	homeState.gridItems = [itemA]

	let store = TestStore(initialState: AppFeature.State(home: homeState)) {
		AppFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(\.home.itemTapped, "a") {
		$0.path[id: 0] = .placeholder(
			PlaceholderFeature.State(title: "A", sfSymbol: "star", tintColor: "#000")
		)
	}
}
