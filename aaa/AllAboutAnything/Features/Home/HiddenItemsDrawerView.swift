import ComposableArchitecture
import SwiftUI

struct HiddenItemsDrawerView: View {
    let items: IdentifiedArrayOf<HomeItem>
    let onShow: (String) -> Void

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                if items.isEmpty {
                    ContentUnavailableView(
                        "No Hidden Items",
                        systemImage: "eye.slash",
                        description: Text("Items you hide from the main grid will appear here.")
                    )
                    .padding(.top, 60)
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(items) { item in
                            Button { onShow(item.id) } label: {
                                HiddenDrawerCell(item: item)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Show \(item.title)")
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Hidden Items")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct HiddenDrawerCell: View {
    let item: HomeItem

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topLeading) {
                Circle()
                    .fill(Color(hex: item.tintColor))
                    .frame(width: 48, height: 48)
                    .overlay {
                        Image(systemName: item.sfSymbol)
                            .font(.system(size: 22))
                            .foregroundStyle(.white)
                            .accessibilityHidden(true)
                    }

                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.white, .green)
                    .offset(x: -6, y: -6)
                    .accessibilityHidden(true)
            }

            Text(item.title)
                .font(.caption)
                .foregroundStyle(.primary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
    }
}
