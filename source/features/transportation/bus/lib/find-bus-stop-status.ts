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

	switch (busStatus) {
		case 'before-start': {
			stopStatus = 'before'
			arrivalTime = stop.departures[0]
			break
		}

		case 'after-end': {
			stopStatus = 'after'
			arrivalTime = stop.departures[stop.departures.length - 1]
			break
		}

		default: {
			arrivalTime = departureIndex === null ? null : stop.departures[departureIndex]

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
