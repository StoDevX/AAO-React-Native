import {DateGroupedScores, DateSection, ProcessedScore, Score, SportSection} from './types'
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

function byParsedDateAscending(a: ProcessedScore, b: ProcessedScore): number {
	return a.parsedDate.getTime() - b.parsedDate.getTime()
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

	yesterday.sort(byParsedDateAscending)
	today.sort(byParsedDateAscending)

	const upcomingSections = Object.keys(upcoming)
		.sort((a, b) => upcoming[a][0].parsedDate.getTime() - upcoming[b][0].parsedDate.getTime())
		.map((title) => {
			const data = upcoming[title].sort(byParsedDateAscending)
			return {title, data}
		})

	return [
		{title: Constants.YESTERDAY, data: yesterday},
		{title: Constants.TODAY, data: today},
		...upcomingSections,
	]
}

/**
 * Derives the sections to render for a date-bucket tab. Today splits into
 * Ongoing/Finalized/Upcoming by game status; Yesterday shows every game with
 * no result filter; Upcoming is the per-day sections with the fixed
 * Yesterday/Today buckets stripped. Empty sections are dropped throughout.
 */
export function sectionsForTab(
	tab: DateSection,
	grouped: DateGroupedScores[],
): DateGroupedScores[] {
	switch (tab) {
		case Constants.YESTERDAY: {
			const data = grouped.find((s) => s.title === Constants.YESTERDAY)?.data ?? []
			return data.length ? [{title: '', data}] : []
		}

		case Constants.TODAY: {
			const scores = grouped.find((s) => s.title === Constants.TODAY)?.data ?? []
			return [
				{title: Constants.ONGOING, data: scores.filter((s) => s.status.indicator === 'O')},
				{
					title: Constants.FINALIZED,
					data: scores.filter((s) => s.status.indicator !== 'O' && s.result !== ''),
				},
				{
					title: Constants.UPCOMING,
					data: scores.filter((s) => s.status.indicator !== 'O' && s.result === ''),
				},
			].filter((s) => s.data.length > 0)
		}

		case Constants.UPCOMING:
			return grouped
				.filter((s) => s.title !== Constants.YESTERDAY && s.title !== Constants.TODAY)
				.filter((s) => s.data.length > 0)

		default: {
			const exhaustive: never = tab
			throw new Error(`Unhandled tab: ${String(exhaustive)}`)
		}
	}
}

/**
 * Groups sport names into Women's, Men's, and Other filter sections. A sport
 * with neither prefix — Volleyball in the current feed — lands in Other
 * Sports rather than being silently dropped. Each section is sorted, and a
 * section with no sports in it is omitted.
 */
export function sportFilterSections(scores: ProcessedScore[]): SportSection[] {
	const uniqueSports = [...new Set(scores.map((s) => s.sport))].sort()
	const womens = uniqueSports.filter((s) => s.includes("Women's"))
	const mens = uniqueSports.filter((s) => s.includes("Men's"))
	const other = uniqueSports.filter((s) => !s.includes("Women's") && !s.includes("Men's"))

	return [
		{title: Constants.WOMENS_SPORTS, data: womens},
		{title: Constants.MENS_SPORTS, data: mens},
		{title: Constants.OTHER_SPORTS, data: other},
	].filter((section) => section.data.length > 0)
}
