import ExpoModulesCore
import SwiftUI

final class PlaceCardScaffoldProps: ExpoSwiftUI.ViewProps {
	/// True at the sheet's large stop, where the list's first row is the big
	/// title and sits straight against the header, as Maps sets it.
	@Field var large: Bool = false
}

/// A place card's header pinned over its list, as Apple Maps pins one: the
/// header is the list's top safe-area bar, so the list scrolls beneath it and
/// the system draws the hard-edged frost Maps shows there -- content blurred
/// under the header, and a crisp line at its bottom.
///
/// Takes exactly two children, the header and then the list. The header has
/// to be the bar's real content: an empty bar with the header layered over it
/// gets no edge effect at all.
struct PlaceCardScaffoldView: ExpoSwiftUI.View {
	@ObservedObject var props: PlaceCardScaffoldProps

	init(props: PlaceCardScaffoldProps) {
		self.props = props
	}

	/// Whether any of the list has gone under the header. Maps shows no edge
	/// until something has.
	@State private var scrolled = false

	var body: some View {
		let children = props.children ?? []
		if children.count == 2 {
			// Drawn through `childView`, as ExpoModulesCore's own `Children()`
			// does. The child itself is a placeholder whose body SwiftUI must
			// never build; wrapping it directly crashes on first render.
			let header: any View = children[0].childView
			let list: any View = children[1].childView
			// A GeometryReader takes exactly the height the sheet offers and
			// sets the card at its top. Without it the card reports its own
			// height, and at the collapsed stop, when large text makes the
			// header taller than the stop, the sheet centres it and cuts off
			// the close button and the top of the title. Pinned, the header
			// runs off the bottom instead, as Maps' does.
			GeometryReader { box in
				AnyView(list)
					// At large Maps starts its big title 4pt up under the header's
					// edge; nil keeps the list's own margin at the other stops.
					.contentMargins(.top, props.large ? -4 : nil, for: .scrollContent)
					.onScrollGeometryChange(for: Bool.self) { geometry in
						geometry.contentOffset.y > -geometry.contentInsets.top + 0.5
					} action: { _, isScrolled in
						scrolled = isScrolled
					}
					.scrollEdgeEffectHidden(!scrolled, for: .top)
					.scrollEdgeEffectStyle(.hard, for: .top)
					.safeAreaBar(edge: .top, spacing: 0) { AnyView(header) }
					.frame(width: box.size.width, height: box.size.height, alignment: .top)
			}
		} else {
			Children()
		}
	}
}
