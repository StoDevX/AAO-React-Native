import type {Temporal} from 'temporal-polyfill'
import type {SingleBuildingScheduleType} from '../types'
import {
	isSameOrAfter,
	isBetween,
	isBefore,
	relativeTo,
} from '../../../lib/temporal'

import {parseHours} from './parse-hours'

function in30(start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime) {
	return isSameOrAfter(start.add({minutes: 30}), end)
}

function timeBetween(
	start: Temporal.ZonedDateTime,
	end: Temporal.ZonedDateTime,
) {
	let startNoSeconds = start.with({
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	})
	return relativeTo(startNoSeconds, end)
}

export function getScheduleStatusAtMoment(
	schedule: SingleBuildingScheduleType,
	m: Temporal.ZonedDateTime,
): string {
	let {open, close} = parseHours(schedule, m)

	if (isBefore(m, open) && in30(m, open)) {
		return `Opens ${timeBetween(m, open)}`
	}

	if (isBetween(m, open, close, 'minute', '[)')) {
		if (in30(m, close)) {
			return `Closes ${timeBetween(m, close)}`
		}

		return 'Open'
	}

	return 'Closed'
}
