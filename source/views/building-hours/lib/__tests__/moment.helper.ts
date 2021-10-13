import moment from 'moment-timezone'
export {moment}

const CENTRAL_TZ = 'America/Chicago'
const baseTime = moment('2019-12-18T18:39:45').tz(CENTRAL_TZ)

export const dayMoment = (time: string, format = 'ddd h:mma') => {
	let parsed = moment.tz(time, format, false, CENTRAL_TZ)

	let dayOfWeek = parsed.day()

	parsed
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())
		.day(dayOfWeek)

	return parsed
}

export const hourMoment = (time: string) =>
	moment
		.tz(time, 'h:mma', false, CENTRAL_TZ)
		.year(baseTime.year())
		.month(baseTime.month())
		.date(baseTime.date())

export const plainMoment = (time: string, format: string) =>
	moment.tz(time, format, false, CENTRAL_TZ)
