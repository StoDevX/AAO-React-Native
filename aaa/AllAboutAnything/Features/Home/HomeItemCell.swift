import SwiftUI

struct HomeItemCell: View {
	let item: HomeItem

	var body: some View {
		VStack(spacing: 8) {
			Circle()
				.fill(Color(hex: item.tintColor))
				.frame(width: 48, height: 48)
				.overlay {
					Image(systemName: item.sfSymbol)
						.font(.system(size: 22))
						.foregroundStyle(.white)
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
