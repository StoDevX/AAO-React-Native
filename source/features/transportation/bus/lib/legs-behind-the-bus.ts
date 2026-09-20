import findLastIndex from 'lodash/findLastIndex'

import type {BusStopStatusEnum} from './find-bus-stop-status'
import type {BusTarget} from './find-bus-target'

/**
 * How much of the route the bus has behind it, counted in legs -- the gaps
 * between one stop and the next, which the strip draws solid rather than faint.
 * Leg `n` runs from stop `n` to stop `n + 1`, so a count of `n` means legs `0`
 * through `n - 1` are solid.
 *
 * The leg the bus is on is one of them: it is solid all the way across rather
 * than changing colour under the bus, so the count is the stop the bus is
 * heading for -- or, standing still, the stop it is standing at.
 *
 * The bus's own position answers this rather than the stops' statuses, which
 * cannot: a stop the route skips has no arrival time to compare the clock
 * against, so it reads as neither before nor after and would leave a faint gap
 * in the rail behind the bus. With no bus on the route at all the stops are
 * all there is to go on, and a line that has finished for the day still reads
 * as a route already driven.
 */
export function legsBehindTheBus(
	cells: Array<{stopStatus: BusStopStatusEnum}>,
	busTarget: BusTarget | null,
): number {
	if (busTarget) {
		return busTarget.targetIndex
	}

	return findLastIndex(cells, (cell) => cell.stopStatus === 'after') + 1
}
