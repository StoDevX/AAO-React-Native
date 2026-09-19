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

	return {cells, currentIndex}
}
