import {formatTime} from '@frogpond/time-format'
import type {Moment} from 'moment-timezone'
import type {DepartureTimeList} from '../types'

/**
 * A strict-mode parse of malformed feed data returns an Invalid Moment, not
 * `null` -- still truthy, so `time && ...` alone would not catch it, and
 * `Intl`-based formatting throws on an Invalid Date where moment's own
 * `.format()` never did.
 */
export function formatDeparture(time: Moment | null): string {
	return time && time.isValid() ? formatTime(time) : 'None'
}

/** A stop's departures as one line, in the order they run. */
export function formatDepartures(times: DepartureTimeList): string {
	return times.map(formatDeparture).join(' • ')
}
