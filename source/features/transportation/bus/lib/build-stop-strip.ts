import find from 'lodash/find'
import type {Moment} from 'moment-timezone'

import type {BusSchedule} from '../types'
import {findArrivalTime, findBusStopStatus, type BusStopStatusEnum} from './find-bus-stop-status'
import type {BusStateEnum} from './get-current-bus-iteration'

/** One stop as the widget's strip draws it: a time over a name, plus where the bus is relative to it. */
export type StopStripCell = {
	name: string
	time: Moment | null
	stopStatus: BusStopStatusEnum
}

type Args = {
	schedule: BusSchedule
	busStatus: BusStateEnum
	departureIndex: null | number
	now: Moment
}

/**
 * The route as one horizontal strip: every stop, the departure it is showing
 * for the round the bus is on, and which cell the strip should open scrolled
 * to.
 *
 * `currentIndex` is the stop the bus is at, or the first one still ahead of
 * it. It is null once the bus is done for the day -- there is nothing ahead to
 * scroll to, so the strip stays where the reader left it.
 */
export function buildStopStrip(args: Args): {
	cells: StopStripCell[]
	currentIndex: number | null
	nextRoundStart: Moment | null
} {
	let {schedule, busStatus, departureIndex, now} = args

	let cells = schedule.timetable.map((stop) => ({
		name: stop.name,
		time: findArrivalTime({stop, busStatus, departureIndex}),
		stopStatus: findBusStopStatus({stop, busStatus, departureIndex, now}),
	}))

	let atIndex = cells.findIndex((cell) => cell.stopStatus === 'at')
	let aheadIndex = cells.findIndex((cell) => cell.stopStatus === 'before')
	let currentIndex = atIndex !== -1 ? atIndex : aheadIndex !== -1 ? aheadIndex : null

	// Which round the strip is showing: the one the bus is on, or -- before the
	// day's first bus -- the first. `after-end` shows the last round of the day.
	let displayedIndex = departureIndex ?? (busStatus === 'after-end' ? schedule.times.length - 1 : 0)

	// The first departure of the round after that one. Deliberately not
	// `getCurrentBusIteration`'s `nextStart`: between rounds that names the
	// start of the round already on screen, which would have the faux stop
	// repeat the strip's own first cell.
	let nextRound = schedule.times[displayedIndex + 1]
	let nextRoundStart =
		busStatus === 'after-end' || !nextRound
			? null
			: (find(nextRound, (time) => Boolean(time)) ?? null)

	return {cells, currentIndex, nextRoundStart}
}
