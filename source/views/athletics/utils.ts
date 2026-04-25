import {DateGroupedScores, Score} from './types'
import {Constants} from './constants'

const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]
const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
]

/**
 * Parse the API's "M/D/YYYY h:mm:ss A" date format into a JS Date.
 * Dates from the API are in America/Chicago time; we treat them as local
 * (same simplification as the carls reference implementation).
 */
export function parseGameDate(dateStr: string): Date {
	// e.g. "1/26/2025 1:00:00 PM"
	const [datePart, timePart, ampm] = dateStr.split(' ')
	const [month, day, year] = datePart.split('/').map(Number)
	const [hours, minutes, seconds] = timePart.split(':').map(Number)
	let hour24 = hours % 12
	if (ampm === 'PM') {
		hour24 += 12
	}
	return new Date(year, month - 1, day, hour24, minutes, seconds)
}

/** Format a Date as "Wednesday, Jan 15" for section headers. */
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

export function groupScoresByDate(scores: Score[]): DateGroupedScores[] {
	const now = new Date()
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
		} else if (isSameDay(date, todayStart)) {
			today.push(score)
		} else if (date > todayStart) {
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
