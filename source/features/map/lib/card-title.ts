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

/// The list's offset at rest, taken from the first report made after layout.
/// Reports arrive before the list is laid out, with a container height of 0
/// and an offset that ignores the header's inset; resting there would make
/// every later reading short by the header's height.
export function restingOffsetFrom(
	resting: number | null,
	geometry: {contentOffsetY: number; containerHeight: number},
): number | null {
	if (resting !== null) {
		return resting
	}
	return geometry.containerHeight > 0 ? geometry.contentOffsetY : null
}
