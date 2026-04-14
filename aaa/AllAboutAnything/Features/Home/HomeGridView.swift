import ComposableArchitecture
import SwiftUI

struct HomeGridView: View {
	let store: StoreOf<HomeFeature>

	@State private var drawerDetent: PresentationDetent = .medium

	private let columns = [
		GridItem(.flexible()),
		GridItem(.flexible()),
	]

	var body: some View {
		ScrollView {
			LazyVGrid(columns: columns, spacing: 12) {
				ForEach(store.gridItems) { item in
					Button {
						store.send(.itemTapped(id: item.id))
					} label: {
						HomeItemCell(item: item)
					}
					.buttonStyle(.plain)
					.accessibilityLabel(item.title)
					.contextMenu {
						Button("Hide \(item.title)", systemImage: "eye.slash") {
							store.send(.hideItem(id: item.id))
						}
					}
				}
			}
			.padding()
		}
		.navigationTitle("All About Anything")
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				Button {
					store.send(.plusButtonTapped)
				} label: {
					Image(systemName: "plus")
				}
				.accessibilityLabel("Add items")
			}
			ToolbarItem(placement: .topBarTrailing) {
				Button {
					store.send(.settingsTapped)
				} label: {
					Image(systemName: "gear")
				}
				.accessibilityLabel("Settings")
			}
		}
		.onAppear { store.send(.onAppear) }
		.sheet(
			isPresented: Binding(
				get: { store.isShowingHiddenItems },
				set: { store.send(.setHiddenItemsPresented($0)) }
			)
		) {
			HiddenItemsDrawerView(items: store.hiddenItems) { id in
				store.send(.showItem(id: id))
			}
			.presentationDetents([.height(80), .medium, .large], selection: $drawerDetent)
			.presentationBackgroundInteraction(.enabled(upThrough: .medium))
		}
	}
}
