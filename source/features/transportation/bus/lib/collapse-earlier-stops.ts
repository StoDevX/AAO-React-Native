/**
 * Which stops a timetable shows before the reader asks for the rest.
 *
 * A route the bus is partway through opens on the stop it is heading for, the
 * one behind it, and everything still to come -- the stops it has already left
 * are behind a single row saying how many there are. Both stops either side of
 * the bus stay visible, which is what keeps the bus itself on screen.
 *
 * Nothing collapses when the bus is not on the route: before its first
 * departure or after its last there is no "here" to open at, and the whole
 * timetable is the answer.
 */
export function collapseEarlierStops(args: {targetIndex: number | null; expanded: boolean}): {
	firstVisibleIndex: number
	hiddenCount: number
} {
	let {targetIndex, expanded} = args

	if (expanded || targetIndex === null) {
		return {firstVisibleIndex: 0, hiddenCount: 0}
	}

	// One stop back from the one the bus is heading for, so the leg it is on
	// has both its ends on screen.
	let firstVisibleIndex = Math.max(0, targetIndex - 1)
	return {firstVisibleIndex, hiddenCount: firstVisibleIndex}
}
