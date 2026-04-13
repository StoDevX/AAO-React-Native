import ComposableArchitecture
import Foundation
import Testing
@testable import AllAboutAnything

@Test @MainActor func onAppearLoadsItems() async {
	let store = TestStore(initialState: HomeFeature.State()) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.seedIfNeeded = {}
		$0.databaseClient.fetchHomeItems = {
			[
				HomeItemWithCustomization(
					item: HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil),
					customization: nil
				),
				HomeItemWithCustomization(
					item: HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil),
					customization: HomeItemCustomization(itemId: "b", sortOrder: 1, isVisible: false)
				),
			]
		}
	}

	await store.send(.onAppear) {
		$0.gridItems = [
			HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil),
		]
		$0.hiddenItems = [
			HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil),
		]
	}
}

@Test @MainActor func toggleEditMode() async {
	let store = TestStore(initialState: HomeFeature.State()) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.seedIfNeeded = {}
		$0.databaseClient.fetchHomeItems = { [] }
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(.toggleEditMode) {
		$0.isEditing = true
	}

	await store.send(.toggleEditMode) {
		$0.isEditing = false
	}
}

@Test @MainActor func hideItemMovesToHidden() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA, itemB]

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(.hideItem(id: "a")) {
		$0.gridItems = [itemB]
		$0.hiddenItems = [itemA]
	}
}

@Test @MainActor func showItemMovesToGrid() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA]
	state.hiddenItems = [itemB]

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	await store.send(.showItem(id: "b")) {
		$0.gridItems = [itemA, itemB]
		$0.hiddenItems = []
	}
}

@Test @MainActor func moveItemReorders() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)
	let itemC = HomeItem(id: "c", title: "C", sfSymbol: "square", tintColor: "#222", destinationView: "c", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA, itemB, itemC]

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { _, _, _ in }
	}

	// Move item at index 2 (C) to index 0
	await store.send(.moveItem(fromOffsets: IndexSet(integer: 2), toOffset: 0)) {
		$0.gridItems = [itemC, itemA, itemB]
	}
}
