import type {SheetDetent} from './sheet-moves'

/// Whether the header's title may run its marquee. Apple Maps keeps it at the
/// collapsed and middle stops; at large the name wraps in the big title and
/// the header shows none.
export function titleMayMove(stop: SheetDetent): boolean {
	return stop !== 'large'
}

/// Whether the big title's name, at the top of the large card, has gone
/// wholly under the pinned header -- which is when Maps puts the small title
/// back in the header. Both frames are in window coordinates, so it holds at
/// any sheet stop, header height and text size. An unmeasured header
/// (`headerBottom` of null) has nothing under it yet.
export function nameUnderHeader(
	name: {y: number; height: number},
	headerBottom: number | null,
): boolean {
	return headerBottom !== null && name.y + name.height <= headerBottom
}
