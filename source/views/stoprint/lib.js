// @flow

const TIME_FORMAT = 'h:mm:ss A'
const TIMEZONE = 'US/Central'
import moment from 'moment-timezone'

const parseTime = (now: moment, time: string): null | moment => {
	// interpret in Central time
	let m = moment.tz(time, TIME_FORMAT, true, TIMEZONE)

	// and set the date to today
	m.dayOfYear(now.dayOfYear())

	// if release time is before current time (regardless of day)
	if (m.diff(now) < 0) {
		// then it expires tomorrow
		m.add(1, 'days')
	}

	return m
}

export const getTimeRemaining = (now: moment, time: string) => {
	const releasedTime: moment = parseTime(now, time)
	return releasedTime.fromNow()
}
