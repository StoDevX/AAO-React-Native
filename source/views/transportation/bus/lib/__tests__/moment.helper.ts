import moment from 'moment-timezone'

const CENTRAL_TZ = 'America/Chicago'

const baseTime = moment('2019-12-18T18:39:45').tz(CENTRAL_TZ)

export const time = (time: string): moment.Moment => {
	return moment
		.tz(time, 'h:mma', true, CENTRAL_TZ)
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())
}

export const dayAndTime = (time: string): moment.Moment => {
	let parsed = moment.tz(time, 'dd h:mma', true, CENTRAL_TZ)

	let dayOfWeek = parsed.day()

	parsed
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())
		.day(dayOfWeek)

	return parsed
}
