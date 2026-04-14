import ComposableArchitecture
import Foundation

@Reducer
struct AppFeature {
	@ObservableState
	struct State: Equatable {
		var home = HomeFeature.State()
		var path = StackState<Path.State>()
	}

	enum Action {
		case home(HomeFeature.Action)
		case path(StackActionOf<Path>)
	}

	@Reducer
	enum Path {
		case placeholder(PlaceholderFeature)
	}

	var body: some ReducerOf<Self> {
		Scope(state: \.home, action: \.home) {
			HomeFeature()
		}

		Reduce { state, action in
			switch action {
			case let .home(.itemTapped(id)):
				guard !state.home.isEditing,
				      let item = state.home.gridItems[id: id] else {
					return .none
				}

				if item.destinationView != nil {
					state.path.append(.placeholder(
						PlaceholderFeature.State(
							title: item.title,
							sfSymbol: item.sfSymbol,
							tintColor: item.tintColor
						)
					))
				} else if let urlString = item.destinationUrl {
					if URL(string: urlString) == nil {
						reportIssue("HomeItem \(item.id) has invalid destinationUrl: \(urlString)")
					} else {
						// For MVP, URL items also go to placeholder.
						// In the future, open in SFSafariViewController.
						state.path.append(.placeholder(
							PlaceholderFeature.State(
								title: item.title,
								sfSymbol: item.sfSymbol,
								tintColor: item.tintColor
							)
						))
					}
				} else {
					reportIssue("HomeItem \(item.id) has no destination (both view and url are nil)")
				}
				return .none

			case .home, .path:
				return .none
			}
		}
		.forEach(\.path, action: \.path)
	}
}

extension AppFeature.Path.State: Equatable {}
