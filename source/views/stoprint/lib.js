// @flow

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'
import moment from 'moment-timezone'

export const parseTime = (now: moment) => (
	time: string,
): null | moment => {

	// interpret in Central time
	let m = moment.tz(time, TIME_FORMAT, true, TIMEZONE)

	// and set the date to today
	m.dayOfYear(now.dayOfYear())

	return m
}

// export const getTimeRemaining = (time: string) => 
