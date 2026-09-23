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

/** A stop's departures as one line, in the order they run. */
export function formatDepartures(times: DepartureTimeList): string {
	return times.map(formatDeparture).join(' • ')
}
