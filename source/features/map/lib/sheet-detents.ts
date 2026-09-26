import type {PresentationDetent} from '@expo/ui/swift-ui/modifiers'

import type {SheetDetent} from './sheet-moves'

/// The collapsed detent, requested in the sheet content's own layout space.
/// UIKit shrinks whatever a sheet presents by a scale tied to the detent --
/// 0.86 at this one on an iPhone 17 Pro simulator -- so the stop renders at
/// `SHEET_COLLAPSED_HEIGHT * scale` and this is not the height it takes on
/// screen.
///
/// It is the picker's header block, `16 + 44 + 16` (see `SEARCH_MARGIN` in
/// `building-picker.tsx`), which at this stop is all the picker draws, so it
/// holds on any device. A shorter stop cannot hold the block, and SwiftUI
/// centres content too tall for the box it is presented in rather than
/// clipping its bottom, so the field's top edge is what a shorter stop cuts
/// off; a taller one gives the slack to the list, and the space below the
/// field grows. `testSheetOpensOnItsCollapsedStop` checks the field is whole.
const SHEET_COLLAPSED_HEIGHT = 76
export const COLLAPSED_DETENT: PresentationDetent = {height: SHEET_COLLAPSED_HEIGHT}

/// Apple Maps' middle stop for a place card, as a fraction of the height the
/// sheet is allowed: its close button and ours sit at the same height on an
/// iPhone 17 Pro simulator running iOS 27. Lower than the app's other detail
/// sheets (`SHEET_RESTING_FRACTION`), because this sheet copies Maps' card.
const MAP_MIDDLE_FRACTION = 0.4613
export const MIDDLE_DETENT: PresentationDetent = {fraction: MAP_MIDDLE_FRACTION}

/// Apple Maps' top stop for a place card sits a little below UIKit's `large`,
/// leaving a strip of map showing: its close button and big title sit at the
/// same heights as ours on an iPhone 17 Pro simulator running iOS 27.
const MAP_LARGE_FRACTION = 0.9873
export const LARGE_DETENT: PresentationDetent = {fraction: MAP_LARGE_FRACTION}
export const SHEET_DETENTS: PresentationDetent[] = [COLLAPSED_DETENT, MIDDLE_DETENT, LARGE_DETENT]

/// The rules speak in names; the modifier speaks in detents. The rules' middle
/// and large stops are Maps' fractions, not UIKit's `medium` and `large`.
export const DETENT_FOR: Record<SheetDetent, PresentationDetent> = {
	collapsed: COLLAPSED_DETENT,
	medium: MIDDLE_DETENT,
	large: LARGE_DETENT,
}

/// Structural like `sheetHeightFor`, since a detent handed back by the sheet
/// is not promised to be the object that went in.
export function nameOf(detent: PresentationDetent): SheetDetent {
	if (detent === 'large') {
		return 'large'
	}
	if (detent === 'medium') {
		return 'medium'
	}
	// Both fractional stops come back as fractions; the halfway point between
	// them tells them apart without trusting an exact float to round-trip.
	if ('fraction' in detent) {
		return detent.fraction > (MAP_MIDDLE_FRACTION + MAP_LARGE_FRACTION) / 2 ? 'large' : 'medium'
	}
	return 'collapsed'
}
