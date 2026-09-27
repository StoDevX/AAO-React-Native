import type {PresentationDetent} from '@expo/ui/swift-ui/modifiers'

/// The picker's header block at the default text size, `16 + 44 + 16`: the
/// search field and its margins (see `SEARCH_MARGIN` in `building-picker.tsx`).
const DEFAULT_HEADER_HEIGHT = 76

/// The collapsed detent: exactly the picker's header block, which at this
/// stop is all the picker draws. The block grows with the text size, as the
/// field in it does, and the stop grows with it, as Apple Maps' does.
///
/// A stop shorter than the block cannot hold it, and SwiftUI centres content
/// too tall for the box it is presented in rather than clipping its bottom,
/// so the field's top edge is what a short stop cuts off -- hence rounding up.
/// Until the block has been measured, or while it reports the zero height a
/// view can give before layout, the default block's height stands in.
///
/// The height is in the sheet content's own layout space. UIKit shrinks
/// whatever a sheet presents by a scale tied to the detent -- 0.86 at this
/// one on an iPhone 17 Pro simulator -- so the stop renders smaller on screen
/// than this.
export function collapsedDetentFor(headerHeight: number | null): PresentationDetent {
	return {height: Math.max(DEFAULT_HEADER_HEIGHT, Math.ceil(headerHeight ?? 0))}
}
