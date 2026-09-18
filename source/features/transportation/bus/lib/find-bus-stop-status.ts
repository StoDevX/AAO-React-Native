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

export function findBusStopStatus(args: Args): BusStopStatusEnum {
	let {stop, busStatus, departureIndex, now, busAtStop} = args

	// Where the bus is outranks what the timetable says: between rounds it waits
	// at the end of the loop it just drove, a stop the next round calls 'before'.
	if (busAtStop) {
		return 'at'
	}

	let stopStatus: BusStopStatusEnum = 'skip'
	let arrivalTime: null | Moment = null

	// `.at()` rather than an index, and `?? null` on each: a departures list
	// holds `null` for a round that skips this stop, which everything below
	// reads correctly, but a stop whose list is shorter than the round being
	// asked for reads as `undefined` -- and `undefined !== null`, so it would
	// pass both the branch test below and the `=== null` backstop at the end
	// and draw as an upcoming arrival. Folding it into `null` says the one
	// thing both cases mean: this stop has no arrival to show.
	switch (busStatus) {
		case 'before-start': {
			stopStatus = 'before'
			arrivalTime = stop.departures.at(0) ?? null
			break
		}

		case 'after-end': {
			stopStatus = 'after'
			arrivalTime = stop.departures.at(-1) ?? null
			break
		}

		default: {
			arrivalTime = departureIndex === null ? null : (stop.departures.at(departureIndex) ?? null)

			if (arrivalTime && now.isAfter(arrivalTime, 'minute')) {
				stopStatus = 'after'
			} else if (arrivalTime && now.isSame(arrivalTime, 'minute')) {
				stopStatus = 'at'
			} else if (arrivalTime !== null) {
				stopStatus = 'before'
			} else {
				stopStatus = 'skip'
			}
		}
	}

	if (arrivalTime === null) {
		stopStatus = 'skip'
	}

	return stopStatus
}
