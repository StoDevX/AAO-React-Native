import {DaySection, GameState, ProcessedScore, Score, SportSection} from './types'
import {Constants} from './constants'
import {isFilterActive} from './store'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = [
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
 * States in which a game can change from one minute to the next -- the same
 * set ccc-server re-reads the feeds every minute for.
 */
const IN_PLAY: ReadonlySet<GameState> = new Set(['started', 'live', 'unofficial-final'])

const ONE_DAY = 24 * 60 * 60 * 1000

/**
 * True while a game is under way or waiting on its official result, for at
 * most a day after kickoff -- the same cap ccc-server applies. A result can go
 * unposted for good, and that one game would otherwise hold the list to its
 * fastest refresh indefinitely.
 */
export function isInPlay(score: Score, now: Date): boolean {
	if (!IN_PLAY.has(score.status.indicator)) {
		return false
	}
	// An all-day fixture has no kickoff to measure from.
	const kickoff = score.date_utc.includes('T') ? Date.parse(score.date_utc) : Number.NaN
	return Number.isNaN(kickoff) || now.getTime() - kickoff < ONE_DAY
}

const MDY_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u

/**
 * The feed sends two `date_utc` shapes: timed events as ISO 8601, and
 * all-day/multi-day events as `M/D/YYYY` with an empty `time`. Dispatch on
 * shape rather than trying one format and falling back to the other.
 *
 * `M/D/YYYY` is parsed into its numeric parts and built as local midnight,
 * rather than handed to `new Date()`, for two reasons: the engine that ships
 * in the app (Hermes) returns Invalid Date for that string even though the
 * engine tests run on doesn't, and a date-only value has no instant of its
 * own — local midnight is the reading a calendar day means.
 */
function parseFeedDate(dateUtc: string): Date {
	if (dateUtc.includes('T')) {
		return new Date(dateUtc)
	}

	const match = MDY_DATE.exec(dateUtc)
	if (!match) {
		return new Date(Number.NaN)
	}

	const [, month, day, year] = match
	return new Date(Number(year), Number(month) - 1, Number(day))
}

/**
 * A record belongs on screen only if its `date_utc` parsed to a real
 * instant, and it isn't a placeholder with no scores yet ("No team
 * scores"), which the feed sends for a fixture that hasn't started
 * reporting anything.
 */
function isDisplayableScore(score: ProcessedScore): boolean {
	return !Number.isNaN(score.parsedDate.getTime()) && score.prescore_info !== 'No team scores'
}

/** Parse each record's `date_utc` and drop the ones with nothing to show. */
export function toProcessedScores(scores: Score[]): ProcessedScore[] {
	return scores
		.map((score) => ({...score, parsedDate: parseFeedDate(score.date_utc)}))
		.filter(isDisplayableScore)
}

/** Format a Date as "Wednesday, January 15" for section headers. */
export function formatDateString(date: Date): string {
	return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** A local day as `YYYY-MM-DD`, which sorts the way the days do. */
function dayKey(d: Date): string {
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${String(d.getFullYear())}-${month}-${day}`
}

function byParsedDateAscending(a: ProcessedScore, b: ProcessedScore): number {
	return a.parsedDate.getTime() - b.parsedDate.getTime()
}

/** "Yesterday", "Today" or "Tomorrow" for those days, else the weekday and date. */
function dayTitle(day: Date, today: Date): string {
	const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
	const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
	switch (dayKey(day)) {
		case dayKey(yesterday):
			return Constants.YESTERDAY
		case dayKey(today):
			return Constants.TODAY
		case dayKey(tomorrow):
			return Constants.TOMORROW
		default:
			return formatDateString(day)
	}
}

/**
 * Lays the games out one section per local day, earliest first, each day in
 * kickoff order. Today always has a section, games or not, so the list
 * always says what today holds.
 */
export function daySections(scores: ProcessedScore[], now: Date = new Date()): DaySection[] {
	const today = startOfDay(now)
	const byDay = new Map<string, {day: Date; data: ProcessedScore[]}>([
		[dayKey(today), {day: today, data: []}],
	])

	for (const score of scores) {
		const day = startOfDay(score.parsedDate)
		const key = dayKey(day)
		const entry = byDay.get(key)
		if (entry) {
			entry.data.push(score)
		} else {
			byDay.set(key, {day, data: [score]})
		}
	}

	return [...byDay.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, {day, data}]) => ({
			key,
			title: dayTitle(day, today),
			isToday: key === dayKey(today),
			data: data.sort(byParsedDateAscending),
		}))
}

/**
 * Groups sport names into Women's, Men's, and Other. A sport with neither
 * prefix — Volleyball, for instance — belongs in Other Sports: the filter must
 * give every sport a place, gendered or not. Each
 * section is sorted, and a section with no sports in it is omitted.
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

/**
 * Narrows the games to the selected sports. An empty selection means "show
 * everything" -- see `isFilterActive`.
 */
export function filterBySport(
	scores: ProcessedScore[],
	selectedSports: string[],
): ProcessedScore[] {
	if (!isFilterActive(selectedSports)) {
		return scores
	}
	return scores.filter((score) => selectedSports.includes(score.sport))
}

/** What a score row says about a game, and how it says it. */
export interface GameSummary {
	/** True while there is a kickoff time but no score: before a game starts,
	 * and after kickoff until something reports a score. */
	showsTime: boolean
	/** The kickoff time, or the result and score once there is one. */
	label: string
	/** The whole row as one sentence, since a scoreboard read field by field
	 * tells a VoiceOver reader very little. */
	accessibilityLabel: string
}

/**
 * What a live or finished row shows: the score, with the result letter in
 * front once there is one. A meet -- cross country, golf, swimming --
 * finishes with no score, and the feed puts the team's placing, when it has
 * one, in `prescore_info` instead.
 */
function resultLabel(score: ProcessedScore): string {
	let hasScore = score.team_score !== '' || score.opponent_score !== ''
	if (score.status.indicator === 'final' && !hasScore) {
		return score.prescore_info.trim() || 'Final'
	}
	return [score.result, `${score.team_score}-${score.opponent_score}`].filter(Boolean).join(' ')
}

/**
 * Decides whether a score row shows a kickoff time or a result.
 *
 * A game that is scheduled, or has started with no score reported yet, shows
 * its time -- ccc-server blanks the score for both. Anything live or finished
 * shows its result; see `resultLabel`.
 */
export function gameSummary(score: ProcessedScore): GameSummary {
	let showsTime = score.status.indicator === 'scheduled' || score.status.indicator === 'started'
	// All-day and multi-day fixtures carry no `time` string.
	let label = showsTime ? score.time || 'All day' : resultLabel(score)

	return {
		showsTime,
		label,
		accessibilityLabel: `${score.sport}: ${score.hometeam.trim()} vs ${score.opponent.trim()}, ${label}`,
	}
}
