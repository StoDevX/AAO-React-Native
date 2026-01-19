import moment from 'moment-timezone'

const CENTRAL_TZ = 'America/Chicago'

const baseTime = moment('2019-12-18T18:39:45').tz(CENTRAL_TZ)

export const time = (timeToFormat: string): moment.Moment => {
	return moment
		.tz(timeToFormat, 'h:mma', true, CENTRAL_TZ)
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())
}

export const dayAndTime = (timeToFormat: string): moment.Moment => {
	let parsed = moment.tz(timeToFormat, 'dd h:mma', true, CENTRAL_TZ)

	let dayOfWeek = parsed.day()

	parsed
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())
		.day(dayOfWeek)

	return parsed
}
