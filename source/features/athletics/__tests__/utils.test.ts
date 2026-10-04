import {
	toProcessedScores,
	daySections,
	formatDateString,
	sportFilterSections,
	filterBySport,
	isInPlay,
} from '../utils'
import {Constants} from '../constants'
import {GameResult, ProcessedScore, Score, StatusInfo} from '../types'

const makeFakeScore = (
	parsedDate: Date,
	extra: Partial<{sport: string; result: GameResult; status: Partial<StatusInfo>}> = {},
): ProcessedScore =>
	({
		id: '1',
		date_utc: parsedDate.toISOString(),
		sport: extra.sport ?? 'Baseball',
		result: extra.result ?? '',
		status: {indicator: 'scheduled', value: '', ...extra.status},
		parsedDate,
		// minimal fields — only what utils needs
	}) as ProcessedScore

const makeFakeApiScore = (overrides: Partial<Score> = {}): Score =>
	({
		id: '21116',
		sport: 'Volleyball',
		date_utc: '2026-08-31T17:00:00.000Z',
		prescore_info: '',
		...overrides,
	}) as Score

describe('toProcessedScores', () => {
	it('resolves an ISO date_utc string to the correct instant', () => {
		const [result] = toProcessedScores([makeFakeApiScore()])
		expect(result.parsedDate.getTime()).toBe(Date.UTC(2026, 7, 31, 17, 0, 0))
	})

	it("resolves an 'M/D/YYYY' date_utc string to local midnight on that day", () => {
		// Checked via getFullYear/getMonth/getDate rather than by comparing
		// against another `new Date(string)` call: Hermes returns Invalid Date
		// for this format even though the engine running this test doesn't, so
		// a test relying on the engine's own parsing would pass here and stay
		// broken on device.
		const [result] = toProcessedScores([makeFakeApiScore({date_utc: '9/5/2026'})])
		expect(result.parsedDate.getFullYear()).toBe(2026)
		expect(result.parsedDate.getMonth()).toBe(8) // September
		expect(result.parsedDate.getDate()).toBe(5)
	})

	it("keeps an all-day record ('M/D/YYYY' date_utc) instead of dropping it", () => {
		const result = toProcessedScores([makeFakeApiScore({date_utc: '9/5/2026'})])
		expect(result).toHaveLength(1)
	})

	it('excludes a record with an unparseable date_utc', () => {
		const result = toProcessedScores([makeFakeApiScore({date_utc: 'not-a-date'})])
		expect(result).toHaveLength(0)
	})

	it("excludes a record with prescore_info 'No team scores'", () => {
		const result = toProcessedScores([makeFakeApiScore({prescore_info: 'No team scores'})])
		expect(result).toHaveLength(0)
	})

	it('keeps a record with ordinary prescore_info text', () => {
		const result = toProcessedScores([makeFakeApiScore({prescore_info: 'Duluth leads 3-1'})])
		expect(result).toHaveLength(1)
	})
})

describe('formatDateString', () => {
	it('produces a human-readable day + date', () => {
		const d = new Date(2025, 0, 26) // Jan 26 2025 Sunday
		const result = formatDateString(d)
		expect(result).toBe('Sunday, January 26')
	})
})

describe('daySections', () => {
	// Fixed reference instant so day math never depends on the clock the test
	// happens to run at.
	const now = new Date(2026, 0, 15, 12, 0, 0) // Thursday, January 15 2026, noon

	it('lays the days out earliest first, naming the ones next to today', () => {
		const lastWeek = makeFakeScore(new Date(2026, 0, 8, 9, 0, 0))
		const yesterday = makeFakeScore(new Date(2026, 0, 14, 9, 0, 0))
		const today = makeFakeScore(new Date(2026, 0, 15, 9, 0, 0))
		const tomorrow = makeFakeScore(new Date(2026, 0, 16, 9, 0, 0))
		const nextWeek = makeFakeScore(new Date(2026, 0, 22, 9, 0, 0))

		const sections = daySections([nextWeek, today, lastWeek, tomorrow, yesterday], now)

		expect(sections.map((s) => s.title)).toEqual([
			formatDateString(new Date(2026, 0, 8)),
			Constants.YESTERDAY,
			Constants.TODAY,
			Constants.TOMORROW,
			formatDateString(new Date(2026, 0, 22)),
		])
		expect(sections.map((s) => s.data)).toEqual([
			[lastWeek],
			[yesterday],
			[today],
			[tomorrow],
			[nextWeek],
		])
	})

	it('keys each day by its date, and marks only today as today', () => {
		const sections = daySections([makeFakeScore(new Date(2026, 0, 14, 9, 0, 0))], now)

		expect(sections.map((s) => [s.key, s.isToday])).toEqual([
			['2026-01-14', false],
			['2026-01-15', true],
		])
	})

	it('keeps an empty Today, so the list always has a today to open at', () => {
		const sections = daySections([makeFakeScore(new Date(2026, 0, 20, 9, 0, 0))], now)

		expect(sections[0]).toEqual({
			key: '2026-01-15',
			title: Constants.TODAY,
			isToday: true,
			data: [],
		})
	})

	it('sorts games within a day chronologically, regardless of input order', () => {
		const early = makeFakeScore(new Date(2026, 0, 15, 9, 0, 0))
		const late = makeFakeScore(new Date(2026, 0, 15, 18, 0, 0))

		const today = daySections([late, early], now).find((s) => s.isToday)

		expect(today?.data).toEqual([early, late])
	})

	it('places a game by its local day, not its UTC one', () => {
		// 11pm local is the next day in UTC anywhere west of Greenwich.
		const lateTonight = makeFakeScore(new Date(2026, 0, 15, 23, 0, 0))

		expect(daySections([lateTonight], now).find((s) => s.isToday)?.data).toEqual([lateTonight])
	})
})

describe('isInPlay', () => {
	const kickoff = '2026-01-15T18:00:00.000Z'
	const makeScore = (indicator: StatusInfo['indicator'], date_utc = kickoff): Score =>
		({id: '1', date_utc, status: {indicator, value: ''}}) as Score
	const anHourIn = new Date('2026-01-15T19:00:00.000Z')

	it.each(['started', 'live', 'unofficial-final'] as const)(
		'is true while a game is %s',
		(state) => {
			expect(isInPlay(makeScore(state), anHourIn)).toBe(true)
		},
	)

	it.each(['scheduled', 'final'] as const)('is false for a game that is %s', (state) => {
		expect(isInPlay(makeScore(state), anHourIn)).toBe(false)
	})

	it('stops counting a game a day after kickoff, result or not', () => {
		const aDayLater = new Date('2026-01-16T18:00:00.000Z')
		const justUnder = new Date(aDayLater.getTime() - 60 * 1000)

		expect(isInPlay(makeScore('started'), justUnder)).toBe(true)
		expect(isInPlay(makeScore('started'), aDayLater)).toBe(false)
	})

	it('counts an all-day fixture, which has no kickoff to measure from', () => {
		expect(isInPlay(makeScore('live', '1/15/2026'), anHourIn)).toBe(true)
	})
})

describe('sportFilterSections', () => {
	// sportFilterSections only reads `sport`, so the date on each fake score is
	// arbitrary — fixed here rather than built from `new Date()` so nothing in
	// this suite depends on the clock.
	const irrelevantDate = new Date(2026, 0, 15)

	it("groups sports into Women's, Men's, and Other, each sorted", () => {
		const scores = [
			makeFakeScore(irrelevantDate, {sport: "Women's Soccer"}),
			makeFakeScore(irrelevantDate, {sport: "Men's Golf"}),
			makeFakeScore(irrelevantDate, {sport: 'Volleyball'}),
			makeFakeScore(irrelevantDate, {sport: "Women's Basketball"}),
		]
		expect(sportFilterSections(scores)).toEqual([
			{title: Constants.WOMENS_SPORTS, data: ["Women's Basketball", "Women's Soccer"]},
			{title: Constants.MENS_SPORTS, data: ["Men's Golf"]},
			{title: Constants.OTHER_SPORTS, data: ['Volleyball']},
		])
	})

	it('puts an ungendered sport into Other Sports', () => {
		const scores = [makeFakeScore(irrelevantDate, {sport: 'Volleyball'})]
		expect(sportFilterSections(scores)).toEqual([
			{title: Constants.OTHER_SPORTS, data: ['Volleyball']},
		])
	})

	it('omits Other Sports when every sport is gendered', () => {
		const scores = [
			makeFakeScore(irrelevantDate, {sport: "Women's Soccer"}),
			makeFakeScore(irrelevantDate, {sport: "Men's Golf"}),
		]
		const sections = sportFilterSections(scores)
		expect(sections.map((s) => s.title)).toEqual([Constants.WOMENS_SPORTS, Constants.MENS_SPORTS])
	})
})

describe('filterBySport', () => {
	// filterBySport only reads `sport`, so the date on each fake score is
	// arbitrary — fixed here rather than built from `new Date()`.
	const day = new Date(2026, 0, 15)
	const baseball = makeFakeScore(day, {sport: 'Baseball'})
	const golf = makeFakeScore(day, {sport: "Men's Golf"})
	const soccer = makeFakeScore(day, {sport: "Women's Soccer"})

	it('returns every game when the selection is empty', () => {
		expect(filterBySport([baseball, golf, soccer], [])).toEqual([baseball, golf, soccer])
	})

	it('keeps only games whose sport is in a non-empty selection', () => {
		expect(filterBySport([baseball, golf, soccer], ['Baseball', "Women's Soccer"])).toEqual([
			baseball,
			soccer,
		])
	})

	it('returns nothing when no game is in a selected sport', () => {
		expect(filterBySport([baseball, golf], ['Volleyball'])).toEqual([])
	})
})
