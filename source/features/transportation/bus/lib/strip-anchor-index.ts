import type {BusTarget} from './find-bus-target'

/**
 * Which stop the strip opens on: the one the bus has just left, so the leg it
 * is on has both ends in view and everything earlier is still there to scroll
 * back to.
 *
 * The bus's own position answers this rather than `currentIndex`, which is the
 * stop the *timetable* calls current -- a stop counts as current for the whole
 * minute of its departure, so the two disagree by a stop for a minute of every
 * leg, and the strip would open a stop too far back.
 */
export function stripAnchorIndex(
	busTarget: BusTarget | null,
	currentIndex: number | null,
): number | null {
	if (busTarget) {
		let {targetIndex, atStop} = busTarget
		return Math.max(0, atStop ? targetIndex : targetIndex - 1)
	}

	// No bus on the route yet, or none left: the stop the timetable calls
	// current is the most useful thing to open on.
	return currentIndex
}
