import ComposableArchitecture
import Foundation

@Reducer
struct BrowserFeature {
	@ObservableState
	struct State: Equatable {
		let url: URL
	}

	enum Action: Equatable {
		case doneTapped
	}

	@Dependency(\.dismiss) var dismiss

	var body: some ReducerOf<Self> {
		Reduce { _, action in
			switch action {
			case .doneTapped:
				return .run { _ in await dismiss() }
			}
		}
	}
}

@Reducer
struct AppFeature {
	@ObservableState
	struct State: Equatable {
		var home = HomeFeature.State()
		var path = StackState<Path.State>()
		@Presents var browser: BrowserFeature.State?
	}

	enum Action {
		case home(HomeFeature.Action)
		case path(StackActionOf<Path>)
		case browser(PresentationAction<BrowserFeature.Action>)
	}

	@Reducer
	enum Path {
		case placeholder(PlaceholderFeature)
		case settings(SettingsFeature)
	}

	var body: some ReducerOf<Self> {
		Scope(state: \.home, action: \.home) {
			HomeFeature()
		}

		Reduce { state, action in
			switch action {
			case let .home(.itemTapped(id)):
				guard let item = state.home.gridItems[id: id] else {
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
					if let url = URL(string: urlString) {
						state.browser = BrowserFeature.State(url: url)
					} else {
						reportIssue("HomeItem \(item.id) has invalid destinationUrl: \(urlString)")
					}
				} else {
					reportIssue("HomeItem \(item.id) has no destination (both view and url are nil)")
				}
				return .none

			case .home(.settingsTapped):
				state.path.append(.settings(SettingsFeature.State()))
				return .none

			case .home, .path, .browser:
				return .none
			}
		}
		.forEach(\.path, action: \.path)
		.ifLet(\.$browser, action: \.browser) {
			BrowserFeature()
		}
	}
}

extension AppFeature.Path.State: Equatable {}
