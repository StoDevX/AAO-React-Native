import ComposableArchitecture
import Foundation

@Reducer
struct HomeFeature {
	@ObservableState
	struct State: Equatable {
		var gridItems: IdentifiedArrayOf<HomeItem> = []
		var hiddenItems: IdentifiedArrayOf<HomeItem> = []
		var isEditing = false
	}

	enum Action: Equatable {
		case onAppear
		case toggleEditMode
		case moveItem(fromOffsets: IndexSet, toOffset: Int)
		case hideItem(id: String)
		case showItem(id: String)
		case itemTapped(id: String)
	}

	@Dependency(\.databaseClient) var databaseClient

	var body: some ReducerOf<Self> {
		Reduce { state, action in
			switch action {
			case .onAppear:
				try? databaseClient.seedIfNeeded()
				let allItems = (try? databaseClient.fetchHomeItems()) ?? []

				let visible = allItems.filter { $0.customization?.isVisible != false }
				let hidden = allItems.filter { $0.customization?.isVisible == false }

				state.gridItems = IdentifiedArrayOf(uniqueElements: visible.map(\.item))
				state.hiddenItems = IdentifiedArrayOf(uniqueElements: hidden.map(\.item))
				return .none

			case .toggleEditMode:
				state.isEditing.toggle()
				return .none

			case let .moveItem(fromOffsets, toOffset):
				state.gridItems.move(fromOffsets: fromOffsets, toOffset: toOffset)
				persistCustomizations(state: state)
				return .none

			case let .hideItem(id):
				if let item = state.gridItems[id: id] {
					state.gridItems.remove(id: id)
					state.hiddenItems.append(item)
					persistCustomizations(state: state)
				}
				return .none

			case let .showItem(id):
				if let item = state.hiddenItems[id: id] {
					state.hiddenItems.remove(id: id)
					state.gridItems.append(item)
					persistCustomizations(state: state)
				}
				return .none

			case .itemTapped:
				// Navigation handled by parent AppFeature
				return .none
			}
		}
	}

	private func persistCustomizations(state: State) {
		for (index, item) in state.gridItems.enumerated() {
			try? databaseClient.updateCustomization(item.id, index, true)
		}
		for (index, item) in state.hiddenItems.enumerated() {
			try? databaseClient.updateCustomization(item.id, index, false)
		}
	}
}
