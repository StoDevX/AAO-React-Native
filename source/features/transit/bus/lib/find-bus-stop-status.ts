import type {Moment} from 'moment'
import type {BusTimetableEntry} from '../types'
import type {BusStateEnum} from './get-current-bus-iteration'

export type BusStopStatusEnum = 'at' | 'before' | 'after' | 'skip'

type Args = {
	stop: BusTimetableEntry
	busStatus: BusStateEnum
	departureIndex: null | number
	now: Moment
	/** Whether the bus is drawn sitting on this stop's dot. */
	busAtStop?: boolean
}

/**
 * Which departure a stop is showing, given where the bus is in its day.
 *
 * `.at()` rather than an index, and `?? null` on each: a departures list holds
 * `null` for a round that skips this stop, but a stop whose list is shorter
 * than the round being asked for reads as `undefined` -- and `undefined !==
 * null`, so a caller testing for `null` would treat it as an upcoming arrival.
 * Folding it into `null` says the one thing both cases mean: this stop has no
 * arrival to show.
 */
export function findArrivalTime(args: {
	stop: BusTimetableEntry
	busStatus: BusStateEnum
	departureIndex: null | number
}): Moment | null {
	let {stop, busStatus, departureIndex} = args

	switch (busStatus) {
		case 'before-start':
			return stop.departures.at(0) ?? null
		case 'after-end':
			return stop.departures.at(-1) ?? null
		default:
			return departureIndex === null ? null : (stop.departures.at(departureIndex) ?? null)
	}
}

export function findBusStopStatus(args: Args): BusStopStatusEnum {
	let {stop, busStatus, departureIndex, now, busAtStop} = args

	// Where the bus is outranks what the timetable says: between rounds it waits
	// at the end of the loop it just drove, a stop the next round calls 'before'.
	if (busAtStop) {
		return 'at'
	}

	let arrivalTime = findArrivalTime({stop, busStatus, departureIndex})

	if (arrivalTime === null) {
		return 'skip'
	}

	switch (busStatus) {
		case 'before-start':
			return 'before'
		case 'after-end':
			return 'after'
		default: {
			if (now.isAfter(arrivalTime, 'minute')) {
				return 'after'
			}
			if (now.isSame(arrivalTime, 'minute')) {
				return 'at'
			}
			return 'before'
		}
	}
}
