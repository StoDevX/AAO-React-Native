import ComposableArchitecture
import Foundation
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

@MainActor
@Test func itemTappedPresentsBrowserForUrlDestination() async {
	let itemB = HomeItem(
		id: "b",
		title: "B",
		sfSymbol: "link",
		tintColor: "#111",
		destinationView: nil,
		destinationUrl: "https://example.com"
	)

	var homeState = HomeFeature.State()
	homeState.gridItems = [itemB]

	let store = TestStore(initialState: AppFeature.State(home: homeState)) {
		AppFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(\.home.itemTapped, "b") {
		$0.browser = BrowserFeature.State(url: URL(string: "https://example.com")!)
	}
}

@MainActor
@Test func itemTappedDoesNotNavigateWhileEditing() async {
	let itemA = HomeItem(
		id: "a",
		title: "A",
		sfSymbol: "star",
		tintColor: "#000",
		destinationView: "a",
		destinationUrl: nil
	)

	var homeState = HomeFeature.State()
	homeState.gridItems = [itemA]
	homeState.isEditing = true

	let store = TestStore(initialState: AppFeature.State(home: homeState)) {
		AppFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(\.home.itemTapped, "a")
	// No state change expected — no trailing closure asserting mutation
}
