import {DateGroupedScores, Score} from './types'
import {Constants} from './constants'

export const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]
export const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

/**
 * Parse the API's "M/D/YYYY h:mm:ss AM/PM" date format into a JS Date.
 * Uses explicit parsing to avoid relying on engine-specific Date.parse behaviour
 * (Hermes does not support this non-standard format).
 */
export function parseGameDate(dateStr: string): Date {
	// e.g. "4/26/2026 4:00:00 PM"
	const parts = dateStr.split(' ')
	if (parts.length !== 3) {
		return new Date(NaN)
	}
	const [datePart, timePart, ampm] = parts
	const [month, day, year] = datePart.split('/').map(Number)
	const [hours, minutes, seconds] = timePart.split(':').map(Number)
	let hour24 = hours % 12
	if (ampm === 'PM') {
		hour24 += 12
	}
	return new Date(year, month - 1, day, hour24, minutes, seconds)
}

/** Format a Date as "Wednesday, January 15" for section headers. */
export function formatDateString(date: Date): string {
	return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function groupScoresByDate(
	scores: Score[],
	now: Date = new Date(),
): DateGroupedScores[] {
	const todayStart = startOfDay(now)
	const yesterdayStart = new Date(todayStart)
	yesterdayStart.setDate(yesterdayStart.getDate() - 1)

	const yesterday: Score[] = []
	const today: Score[] = []
	const upcoming: Record<string, Score[]> = {}

	for (const score of scores) {
		const date = parseGameDate(score.date_utc)
		if (isSameDay(date, yesterdayStart)) {
			yesterday.push(score)
		} else if (isSameDay(date, todayStart) && date <= now) {
			// Game is today and has already started/finished
			today.push(score)
		} else if (date > now) {
			// Game hasn't happened yet — includes later today and future days
			const key = formatDateString(date)
			if (!upcoming[key]) {
				upcoming[key] = []
			}
			upcoming[key].push(score)
		}
		// older games are omitted (same as carls behaviour)
	}

	const upcomingSections = Object.keys(upcoming).map((title) => ({
		title: title as DateGroupedScores['title'],
		data: upcoming[title],
	}))

	return [
		{title: Constants.YESTERDAY, data: yesterday},
		{title: Constants.TODAY, data: today},
		...upcomingSections,
	]
}
