import type {Moment} from 'moment-timezone'

import type {BusSchedule} from '../types'
import {findBusTarget, type BusTarget} from './find-bus-target'
import type {BusStateEnum} from './get-current-bus-iteration'

type Iteration = {
	status: BusStateEnum
	index: null | number
	parkedStopIndex: null | number
}

/**
 * Which trip the widget's strip shows, and where on it the bus sits.
 *
 * On the move, that is the trip the bus is on. Between trips it is harder: the
 * bus is parked at the end of the trip it just finished, while the line's
 * iteration has already moved on to the next one. The strip has one time per
 * stop, so drawing the parked bus against the next trip's times puts it beside
 * an arrival still to come, with the rail behind it solid -- a bus mid-trip on
 * a line whose header says the next one has not started.
 *
 * So the strip picks one trip and keeps the bus and the times on it. On a loop,
 * where a trip ends at the stop the next begins from, the bus is already
 * waiting at the start of the next trip, and the strip shows that trip with the
 * bus at its first stop. On a route that ends somewhere else, it shows the trip
 * just finished, driven to the end, with the next departure in its end slot.
 *
 * The timetable does not ask this: it lists several departures per stop, and
 * keeps the parked bus at the end of the route it has driven.
 */
export function tripOnTheStrip(
	schedule: BusSchedule,
	iteration: Iteration,
	now: Moment,
): {departureIndex: number | null; busTarget: BusTarget | null} {
	let {status, index, parkedStopIndex} = iteration
	let busTarget = findBusTarget(schedule, iteration, now)

	if (status !== 'between-rounds' || index === null || parkedStopIndex === null) {
		return {departureIndex: index, busTarget}
	}

	let nextTrip = schedule.times[index] ?? []
	let startIndex = nextTrip.findIndex((time) => time !== null)
	let parkedAt = schedule.timetable[parkedStopIndex]?.name
	let startsFrom = schedule.timetable[startIndex]?.name

	// Compared by name: a loop lists its terminus twice, once at each end.
	if (parkedAt !== undefined && parkedAt === startsFrom) {
		return {departureIndex: index, busTarget: {targetIndex: startIndex, progress: 1, atStop: true}}
	}

	return {departureIndex: index - 1, busTarget}
}
