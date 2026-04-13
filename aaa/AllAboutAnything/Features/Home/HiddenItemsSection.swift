import ComposableArchitecture
import SwiftUI

struct HiddenItemsSection: View {
	let items: IdentifiedArrayOf<HomeItem>
	let onShow: (String) -> Void

	private let columns = [
		GridItem(.flexible()),
		GridItem(.flexible()),
	]

	var body: some View {
		if !items.isEmpty {
			VStack(alignment: .leading, spacing: 12) {
				Divider()

				Text("Hidden")
					.font(.subheadline)
					.fontWeight(.semibold)
					.foregroundStyle(.secondary)
					.textCase(.uppercase)
					.padding(.horizontal, 4)

				LazyVGrid(columns: columns, spacing: 12) {
					ForEach(items) { item in
						Button {
							onShow(item.id)
						} label: {
							HiddenItemCell(item: item)
						}
						.buttonStyle(.plain)
						.accessibilityLabel("Show \(item.title)")
					}
				}
			}
		}
	}
}

private struct HiddenItemCell: View {
	let item: HomeItem

	var body: some View {
		VStack(spacing: 8) {
			ZStack(alignment: .topLeading) {
				Circle()
					.fill(Color(hex: item.tintColor))
					.frame(width: 48, height: 48)
					.opacity(0.5)
					.overlay {
						Image(systemName: item.sfSymbol)
							.font(.system(size: 22))
							.foregroundStyle(.white.opacity(0.7))
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
				.foregroundStyle(.secondary)
				.lineLimit(1)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 12)
		.background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
	}
}
