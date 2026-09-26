import {formatTime} from '@frogpond/time-format'
import type {Moment} from 'moment-timezone'
import type {DepartureTimeList} from '../types'

/** Stands in for the time of a trip that does not serve the stop. */
export const NOT_SERVED = '—'

/** What a screen reader says for `NOT_SERVED`, which it would read as "em dash". */
export const NOT_SERVED_SPOKEN = 'not served on this trip'

/**
 * A strict-mode parse of malformed feed data returns an Invalid Moment, not
 * `null` -- still truthy, so `time && ...` alone would not catch it, and
 * `Intl`-based formatting throws on an Invalid Date where moment's own
 * `.format()` never did.
 */
export function formatDeparture(time: Moment | null): string {
	return time && time.isValid() ? formatTime(time) : NOT_SERVED
}

/**
 * A stop's next `count` departures as one line, in the order they run. Trips
 * that skip the stop are left out before counting, so the line names buses a
 * rider can catch.
 */
export function formatDepartures(times: DepartureTimeList, count: number): string {
	let served = times.filter((time): time is Moment => time !== null && time.isValid())
	if (served.length === 0) {
		return NOT_SERVED
	}
	return served.slice(0, count).map(formatDeparture).join(' • ')
}
