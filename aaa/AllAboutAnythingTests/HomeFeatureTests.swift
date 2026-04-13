import ComposableArchitecture
import ConcurrencyExtras
import Foundation
import Testing
@testable import AllAboutAnything

private struct CustomizationCall: Equatable, Sendable {
	let id: String
	let sortOrder: Int
	let isVisible: Bool
}

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

@Test @MainActor func hideItemMovesToHiddenAndPersists() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA, itemB]

	let persistedCalls = LockIsolated<[CustomizationCall]>([])

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { id, sortOrder, isVisible in
			persistedCalls.withValue { $0.append(CustomizationCall(id: id, sortOrder: sortOrder, isVisible: isVisible)) }
		}
	}

	await store.send(.hideItem(id: "a")) {
		$0.gridItems = [itemB]
		$0.hiddenItems = [itemA]
	}

	// After hiding "a", persistence writes:
	// - itemB at sortOrder 0 with isVisible: true (the remaining grid item)
	// - itemA at sortOrder 0 with isVisible: false (the hidden item)
	let calls = persistedCalls.value
	#expect(calls.count == 2)
	#expect(calls.contains(CustomizationCall(id: "b", sortOrder: 0, isVisible: true)))
	#expect(calls.contains(CustomizationCall(id: "a", sortOrder: 0, isVisible: false)))
}

@Test @MainActor func showItemMovesToGridAndPersists() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA]
	state.hiddenItems = [itemB]

	let persistedCalls = LockIsolated<[CustomizationCall]>([])

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { id, sortOrder, isVisible in
			persistedCalls.withValue { $0.append(CustomizationCall(id: id, sortOrder: sortOrder, isVisible: isVisible)) }
		}
	}

	await store.send(.showItem(id: "b")) {
		$0.gridItems = [itemA, itemB]
		$0.hiddenItems = []
	}

	// After showing "b", persistence writes:
	// - itemA at sortOrder 0 with isVisible: true
	// - itemB at sortOrder 1 with isVisible: true
	// (hidden list is now empty, so no hidden writes)
	let calls = persistedCalls.value
	#expect(calls.count == 2)
	#expect(calls.contains(CustomizationCall(id: "a", sortOrder: 0, isVisible: true)))
	#expect(calls.contains(CustomizationCall(id: "b", sortOrder: 1, isVisible: true)))
}

@Test @MainActor func moveItemReordersAndPersists() async {
	let itemA = HomeItem(id: "a", title: "A", sfSymbol: "star", tintColor: "#000", destinationView: "a", destinationUrl: nil)
	let itemB = HomeItem(id: "b", title: "B", sfSymbol: "circle", tintColor: "#111", destinationView: "b", destinationUrl: nil)
	let itemC = HomeItem(id: "c", title: "C", sfSymbol: "square", tintColor: "#222", destinationView: "c", destinationUrl: nil)

	var state = HomeFeature.State()
	state.gridItems = [itemA, itemB, itemC]

	let persistedCalls = LockIsolated<[CustomizationCall]>([])

	let store = TestStore(initialState: state) {
		HomeFeature()
	} withDependencies: {
		$0.databaseClient.updateCustomization = { id, sortOrder, isVisible in
			persistedCalls.withValue { $0.append(CustomizationCall(id: id, sortOrder: sortOrder, isVisible: isVisible)) }
		}
	}

	// Move item at index 2 (C) to index 0
	await store.send(.moveItem(fromOffsets: IndexSet(integer: 2), toOffset: 0)) {
		$0.gridItems = [itemC, itemA, itemB]
	}

	// After reordering to [C, A, B], persistence writes all three grid items
	// with their new sort orders; hidden list is empty so no hidden writes
	let calls = persistedCalls.value
	#expect(calls.count == 3)
	#expect(calls.contains(CustomizationCall(id: "c", sortOrder: 0, isVisible: true)))
	#expect(calls.contains(CustomizationCall(id: "a", sortOrder: 1, isVisible: true)))
	#expect(calls.contains(CustomizationCall(id: "b", sortOrder: 2, isVisible: true)))
}
