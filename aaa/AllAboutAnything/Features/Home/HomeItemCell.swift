import SwiftUI

struct HomeItemCell: View {
	let item: HomeItem
	let isEditing: Bool

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

				if isEditing {
					Image(systemName: "minus.circle.fill")
						.font(.system(size: 20))
						.foregroundStyle(.white, .red)
						.offset(x: -6, y: -6)
						.accessibilityHidden(true)
				}
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
