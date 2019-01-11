// @flow

const TIME_FORMAT = 'h:mma'
const TIMEZONE = 'America/Winnipeg'
import moment from 'moment-timezone'

// TODO: Do "dayOfYear" handling better so that we don't need to handle wrapping at
// the 6 month mark. (See #3375 for why this function changed.)
export const parseTime = (now: moment) => (
	time: string | false,
): null | moment => {
	// either pass `false` through or return a parsed time
	if (time === false) {
		return null
	}

	// interpret in Central time
	let m = moment.tz(time, TIME_FORMAT, true, TIMEZONE)

	// and set the date to today
	m.dayOfYear(now.dayOfYear())

	let sixMonthsAgo = moment(now).subtract(6, 'months')
	let sixMonthsFromNow = moment(now).add(6, 'months')

	if (m.isBefore(sixMonthsAgo)) {
		m.add(1, 'year')
	} else if (m.isAfter(sixMonthsFromNow)) {
		m.subtract(1, 'year')
	}

	return m
}
