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
					if store.isEditing {
						Button {
							store.send(.hideItem(id: item.id))
						} label: {
							HomeItemCell(item: item, isEditing: true)
						}
						.buttonStyle(.plain)
						.accessibilityLabel("Hide \(item.title)")
					} else {
						Button {
							store.send(.itemTapped(id: item.id))
						} label: {
							HomeItemCell(item: item, isEditing: false)
						}
						.buttonStyle(.plain)
						.accessibilityLabel(item.title)
					}
				}
			}
			.padding()
		}
		.navigationTitle("All About Anything")
		.toolbar {
			ToolbarItem(placement: .topBarTrailing) {
				Button(store.isEditing ? "Done" : "Edit") {
					store.send(.toggleEditMode)
				}
			}
		}
		.onAppear { store.send(.onAppear) }
		.sheet(
			isPresented: Binding(
				get: { store.isEditing },
				set: { isPresented in
					if !isPresented && store.isEditing {
						store.send(.toggleEditMode)
					}
				}
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
