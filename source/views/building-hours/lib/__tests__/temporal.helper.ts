import {Temporal} from 'temporal-polyfill'
import {parseDateFormat} from '../../../../lib/temporal'

const CENTRAL_TZ = 'America/Chicago'

// Base date: 2019-12-18 (Wednesday) in Central time
const BASE_ISO = '2019-12-18T18:39:45[America/Chicago]'
const baseDate = Temporal.ZonedDateTime.from(BASE_ISO).toPlainDate()

// Map moment-style day name to moment's day() number (0=Sun, 6=Sat)
const DAY_NAME_TO_NUM: Record<string, number> = {
	Su: 0,
	Sun: 0,
	Sunday: 0,
	Mo: 1,
	Mon: 1,
	Monday: 1,
	Tu: 2,
	Tue: 2,
	Tuesday: 2,
	We: 3,
	Wed: 3,
	Wednesday: 3,
	Th: 4,
	Thu: 4,
	Thursday: 4,
	Fr: 5,
	Fri: 5,
	Friday: 5,
	Sa: 6,
	Sat: 6,
	Saturday: 6,
}

// Dec 18, 2019 is Wednesday => moment's day() = 3
const BASE_DAY_NUM = 3

function parseDayAndTime(time: string, fmt: string): Temporal.ZonedDateTime {
	// Extract the day name prefix (before first space, or first non-digit/colon/am/pm)
	// Format examples: 'ddd h:mma', 'ddd h:mm:ssa'
	const dayMatch = time.match(/^([A-Za-z]+)\s+(.+)$/)
	if (!dayMatch) {
		throw new Error(`parseDayAndTime: cannot parse "${time}" with "${fmt}"`)
	}
	const [, dayStr, timeStr] = dayMatch
	const dayNum = DAY_NAME_TO_NUM[dayStr]
	if (dayNum === undefined) {
		throw new Error(`parseDayAndTime: unknown day "${dayStr}"`)
	}

	// Find the calendar date for that day in the base week
	const diff = dayNum - BASE_DAY_NUM
	const date = baseDate.add({days: diff})

	// Parse the time portion (h:mma or h:mm:ssa)
	const timeMatch = timeStr.match(
		/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|AM|PM)?$/i,
	)
	if (!timeMatch) {
		throw new Error(`parseDayAndTime: cannot parse time "${timeStr}"`)
	}
	let hour = parseInt(timeMatch[1], 10)
	const minute = parseInt(timeMatch[2], 10)
	const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0
	const ampm = timeMatch[4]?.toLowerCase() ?? ''
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

/** Parse a day+time string like 'Fri 3:00pm' (format: 'ddd h:mma') */
export const dayMoment = (
	time: string,
	_format = 'ddd h:mma',
): Temporal.ZonedDateTime => {
	return parseDayAndTime(time, _format)
}

/** Parse a time string like '10:01am' and set it on the base date (Dec 18, 2019) */
export const hourMoment = (time: string): Temporal.ZonedDateTime => {
	const m = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i)
	if (!m) {
		throw new Error(`hourMoment: cannot parse "${time}"`)
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

/** Parse an arbitrary date+time string with the given format */
export const plainMoment = (
	time: string,
	fmt: string,
): Temporal.ZonedDateTime => parseDateFormat(time, fmt, CENTRAL_TZ)
