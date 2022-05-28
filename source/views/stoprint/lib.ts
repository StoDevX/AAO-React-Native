const TIME_FORMAT = 'h:mm:ss A'
import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'

const parseTime = (now: Moment, time: string): null | Moment => {
	// interpret in Central time
	let m = moment.tz(time, TIME_FORMAT, true, timezone())

	// and set the date to today
	m.dayOfYear(now.dayOfYear())

	// if release time is before current time (regardless of day)
	if (m.diff(now) < 0) {
		// then it expires tomorrow
		m.add(1, 'days')
	}

	return m
}

export const getTimeRemaining = (now: Moment, time: string) => {
	return parseTime(now, time)?.fromNow()
}
