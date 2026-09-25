import type {SheetDetent} from './sheet-moves'

/// Whether the header's title may run its marquee. Apple Maps keeps it at the
/// collapsed and middle stops; at large the name wraps in the big title and
/// the header shows none.
export function titleMayMove(stop: SheetDetent): boolean {
	return stop !== 'large'
}

/// Whether the big title at the top of the large card has scrolled all the
/// way up under the pinned header, which is when Maps puts the small title
/// back in the header: once the list has moved `distanceToSwap` from rest
/// (see `swapDistance`).
///
/// Measured from `restingOffsetY` rather than zero: a List inset by a
/// safe-area bar rests at a negative offset. A `distanceToSwap` of 0 or less
/// means it is not known yet, and the title has not gone anywhere.
export function bigTitleScrolledAway(
	offsetY: number,
	restingOffsetY: number,
	distanceToSwap: number,
): boolean {
	return distanceToSwap > 0 && offsetY - restingOffsetY >= distanceToSwap
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

/// How far the list must scroll from rest before the big title has gone
/// wholly under the header. The list rests with a margin between the
/// header's bottom edge and the big title's top, so the title has only gone
/// once that margin and its own height have scrolled by. All three values
/// are in one coordinate space, taken with the list at rest.
export function swapDistance(
	bigTitleTopAtRest: number,
	bigTitleHeight: number,
	headerBottom: number,
): number {
	return bigTitleTopAtRest - headerBottom + bigTitleHeight
}
