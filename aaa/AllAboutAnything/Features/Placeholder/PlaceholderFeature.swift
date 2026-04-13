import ComposableArchitecture

@Reducer
struct PlaceholderFeature {
	@ObservableState
	struct State: Equatable {
		let title: String
		let sfSymbol: String
		let tintColor: String
	}

	enum Action: Equatable {}

	var body: some ReducerOf<Self> {
		EmptyReducer()
	}
}
