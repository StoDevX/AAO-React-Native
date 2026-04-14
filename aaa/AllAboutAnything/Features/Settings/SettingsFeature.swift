import ComposableArchitecture
import Foundation

@Reducer
struct SettingsFeature {
	@ObservableState
	struct State: Equatable {}

	enum Action: Equatable {}

	var body: some ReducerOf<Self> {
		EmptyReducer()
	}
}
