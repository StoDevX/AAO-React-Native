import {Temporal} from 'temporal-polyfill'

const CENTRAL_TZ = 'America/Chicago'

// Base date: 2019-12-18 (Wednesday) in Central time
const baseDate = Temporal.PlainDate.from({year: 2019, month: 12, day: 18})

// Map moment-style day name to moment's day() number (0=Sun, 6=Sat)
const DAY_NAME_TO_NUM: Record<string, number> = {
	Su: 0,
	Sun: 0,
	Mo: 1,
	Mon: 1,
	Tu: 2,
	Tue: 2,
	We: 3,
	Wed: 3,
	Th: 4,
	Thu: 4,
	Fr: 5,
	Fri: 5,
	Sa: 6,
	Sat: 6,
}

// Dec 18, 2019 is Wednesday => moment's day() = 3
const BASE_DAY_NUM = 3

/** Parse a time string like '10:01am' and set it on the base date (Dec 18, 2019) */
export const time = (timeToFormat: string): Temporal.ZonedDateTime => {
	const m = timeToFormat.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i)
	if (!m) {
		throw new Error(`time: cannot parse "${timeToFormat}"`)
	}
	let hour = parseInt(m[1], 10)
	const minute = parseInt(m[2], 10)
	const second = m[3] ? parseInt(m[3], 10) : 0
	const ampm = m[4]?.toLowerCase() ?? ''
	if (ampm === 'pm' && hour < 12) hour += 12
	if (ampm === 'am' && hour === 12) hour = 0

	return Temporal.PlainDateTime.from({
		year: baseDate.year,
		month: baseDate.month,
		day: baseDate.day,
		hour,
		minute,
		second,
	}).toZonedDateTime(CENTRAL_TZ)
}

/** Parse a day+time string like 'Fr 3:00pm' (2-letter day + time) */
export const dayAndTime = (timeToFormat: string): Temporal.ZonedDateTime => {
	const dayMatch = timeToFormat.match(/^([A-Za-z]+)\s+(.+)$/)
	if (!dayMatch) {
		throw new Error(`dayAndTime: cannot parse "${timeToFormat}"`)
	}
	const [, dayStr, timeStr] = dayMatch
	const dayNum = DAY_NAME_TO_NUM[dayStr]
	if (dayNum === undefined) {
		throw new Error(`dayAndTime: unknown day "${dayStr}"`)
	}

	const diff = dayNum - BASE_DAY_NUM
	const date = baseDate.add({days: diff})

	const m = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM)?$/i)
	if (!m) {
		throw new Error(`dayAndTime: cannot parse time "${timeStr}"`)
	}
	let hour = parseInt(m[1], 10)
	const minute = parseInt(m[2], 10)
	const second = m[3] ? parseInt(m[3], 10) : 0
	const ampm = m[4]?.toLowerCase() ?? ''
	if (ampm === 'pm' && hour < 12) hour += 12
	if (ampm === 'am' && hour === 12) hour = 0

	return Temporal.PlainDateTime.from({
		year: date.year,
		month: date.month,
		day: date.day,
		hour,
		minute,
		second,
	}).toZonedDateTime(CENTRAL_TZ)
}
