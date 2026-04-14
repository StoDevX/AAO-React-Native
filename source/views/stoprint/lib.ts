const TIME_FORMAT = 'h:mm:ss A'
import {timezone} from '@frogpond/constants'
import type {Temporal} from 'temporal-polyfill'
import {parseTimeToday, isBefore, fromNow} from '../../lib/temporal'

const parseTime = (
	now: Temporal.ZonedDateTime,
	time: string,
): null | Temporal.ZonedDateTime => {
	let m = parseTimeToday(time, timezone(), now)

	// if release time is before current time (regardless of day)
	if (isBefore(m, now)) {
		// then it expires tomorrow
		m = m.add({days: 1})
	}

	return m
}

export const getTimeRemaining = (
	now: Temporal.ZonedDateTime,
	time: string,
): undefined | string => {
	let parsed = parseTime(now, time)
	return parsed ? fromNow(parsed) : undefined
}

void TIME_FORMAT
