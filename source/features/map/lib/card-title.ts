import type {SheetDetent} from './sheet-moves'

/// Whether the header's title may run its marquee. Apple Maps keeps it at the
/// collapsed and middle stops; at large the name wraps in the big title and
/// the header shows none.
export function titleMayMove(stop: SheetDetent): boolean {
	return stop !== 'large'
}

/// Whether the big title at the top of the large card has scrolled all the
/// way up under the pinned header, which is when Maps puts the small title
/// back in the header.
///
/// Measured from `restingOffsetY` rather than zero: a List inset by a
/// safe-area bar rests at a negative offset. An unmeasured title
/// (`bigTitleHeight` of 0) has not gone anywhere.
export function bigTitleScrolledAway(
	offsetY: number,
	restingOffsetY: number,
	bigTitleHeight: number,
): boolean {
	return bigTitleHeight > 0 && offsetY - restingOffsetY >= bigTitleHeight
}
