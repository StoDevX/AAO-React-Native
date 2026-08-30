import {DateGroupedScores, ProcessedScore, Score} from './types'
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
 * A record belongs on screen only if its `date_utc` parsed to a real
 * instant — ruling out a feed format change, which would otherwise surface
 * as missing rows rather than a blank screen — and it isn't a placeholder
 * with no scores yet ("No team scores"), which the row component has
 * nothing to render for.
 */
function isDisplayableScore(score: ProcessedScore): boolean {
	return !Number.isNaN(score.parsedDate.getTime()) && score.prescore_info !== 'No team scores'
}

/** Parse each record's `date_utc` and drop the ones with nothing to show. */
export function toProcessedScores(scores: Score[]): ProcessedScore[] {
	return scores
		.map((score) => ({...score, parsedDate: new Date(score.date_utc)}))
		.filter(isDisplayableScore)
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
	scores: ProcessedScore[],
	now: Date = new Date(),
): DateGroupedScores[] {
	const todayStart = startOfDay(now)
	const yesterdayStart = new Date(todayStart)
	yesterdayStart.setDate(yesterdayStart.getDate() - 1)

	const yesterday: ProcessedScore[] = []
	const today: ProcessedScore[] = []
	const upcoming: Record<string, ProcessedScore[]> = {}

	for (const score of scores) {
		const date = score.parsedDate
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

	const upcomingSections = Object.keys(upcoming)
		.sort((a, b) => upcoming[a][0].parsedDate.getTime() - upcoming[b][0].parsedDate.getTime())
		.map((title) => ({
			title: title as DateGroupedScores['title'],
			data: upcoming[title],
		}))

	return [
		{title: Constants.YESTERDAY, data: yesterday},
		{title: Constants.TODAY, data: today},
		...upcomingSections,
	]
}
