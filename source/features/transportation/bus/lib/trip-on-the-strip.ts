import type {Moment} from 'moment-timezone'

import type {BusSchedule} from '../types'
import {findBusTarget, type BusTarget, type Iteration} from './find-bus-target'

/**
 * Which trip the widget's strip shows, and where on it the bus sits.
 *
 * On the move, that is the trip the bus is on. Between trips the line's
 * iteration has already moved on to the next trip, while the bus is parked at
 * the end of the one it finished. The strip has one time per stop, so it
 * shows the finished trip: the bus stays beside the stop it arrived at, and
 * the strip's end slot names the next departure.
 *
 * The timetable does not ask this: it lists several departures per stop, so
 * its rows count forward from the next trip.
 */
export function tripOnTheStrip(
	schedule: BusSchedule,
	iteration: Iteration,
	now: Moment,
): {departureIndex: number | null; busTarget: BusTarget | null} {
	let {status, index} = iteration

	// `getCurrentBusIteration` reports a gap only after a trip has run, so the
	// finished trip is always at `index - 1`.
	let departureIndex = status === 'between-rounds' && index !== null ? index - 1 : index

	return {departureIndex, busTarget: findBusTarget(schedule, iteration, now)}
}
