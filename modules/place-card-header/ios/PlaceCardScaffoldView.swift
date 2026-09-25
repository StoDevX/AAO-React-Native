import ExpoModulesCore
import SwiftUI

final class PlaceCardScaffoldProps: ExpoSwiftUI.ViewProps {}

/// A place card's header pinned over its list, as Apple Maps pins one: the
/// header is the list's top safe-area bar, so the list scrolls beneath it and
/// the system draws the hard-edged frost Maps shows there -- content blurred
/// under the header, and a crisp line at its bottom.
///
/// Takes exactly two children, the header and then the list. The header has
/// to be the bar's real content: an empty bar with the header layered over it
/// gets no edge effect at all (tried; see the plan's Task 0).
struct PlaceCardScaffoldView: ExpoSwiftUI.View {
	@ObservedObject var props: PlaceCardScaffoldProps

	init(props: PlaceCardScaffoldProps) {
		self.props = props
	}

	var body: some View {
		let children = props.children ?? []
		if children.count == 2 {
			// Drawn through `childView`, as ExpoModulesCore's own `Children()`
			// does. The child itself is a placeholder whose body SwiftUI must
			// never build; wrapping it directly crashes on first render.
			let header: any View = children[0].childView
			let list: any View = children[1].childView
			AnyView(list)
				.scrollEdgeEffectStyle(.hard, for: .top)
				.safeAreaBar(edge: .top, spacing: 0) { AnyView(header) }
		} else {
			Children()
		}
	}
}
