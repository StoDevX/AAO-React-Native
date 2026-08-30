import {
	toProcessedScores,
	groupScoresByDate,
	formatDateString,
	sectionsForTab,
	sportFilterSections,
	filterSectionsBySport,
} from '../utils'
import {Constants} from '../constants'
import {DateGroupedScores, GameResult, ProcessedScore, Score, StatusInfo} from '../types'

const makeFakeScore = (
	parsedDate: Date,
	extra: Partial<{sport: string; result: GameResult; status: Partial<StatusInfo>}> = {},
): ProcessedScore =>
	({
		id: '1',
		date_utc: parsedDate.toISOString(),
		sport: extra.sport ?? 'Baseball',
		result: extra.result ?? '',
		status: {indicator: 'A', value: '', ...extra.status},
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

describe('groupScoresByDate', () => {
	// Fixed reference instant so bucket math never depends on the clock the
	// test happens to run at.
	const now = new Date(2026, 0, 15, 12, 0, 0) // Thursday, January 15 2026, noon

	it('places a past game in the Yesterday bucket', () => {
		const yesterday = new Date(2026, 0, 14, 9, 0, 0)
		const score = makeFakeScore(yesterday)
		const groups = groupScoresByDate([score], now)
		const yGroup = groups.find((g) => g.title === Constants.YESTERDAY)
		expect(yGroup?.data).toHaveLength(1)
	})

	it('places a same-day game in the Today bucket', () => {
		const today = new Date(2026, 0, 15, 9, 0, 0)
		const score = makeFakeScore(today)
		const groups = groupScoresByDate([score], now)
		const todayGroup = groups.find((g) => g.title === Constants.TODAY)
		expect(todayGroup?.data).toHaveLength(1)
	})

	it('sorts games within a bucket chronologically, regardless of input order', () => {
		const early = makeFakeScore(new Date(2026, 0, 15, 9, 0, 0))
		const late = makeFakeScore(new Date(2026, 0, 15, 18, 0, 0))
		// fed in reverse-chronological order
		const groups = groupScoresByDate([late, early], now)
		const todayGroup = groups.find((g) => g.title === Constants.TODAY)
		expect(todayGroup?.data).toEqual([early, late])
	})

	it('orders upcoming day sections earliest-first, and each day chronologically', () => {
		const laterDay = makeFakeScore(new Date(2026, 0, 20, 9, 0, 0))
		const soonerDayLate = makeFakeScore(new Date(2026, 0, 17, 18, 0, 0))
		const soonerDayEarly = makeFakeScore(new Date(2026, 0, 17, 9, 0, 0))
		// fed with the later day first, and the sooner day's games reversed
		const groups = groupScoresByDate([laterDay, soonerDayLate, soonerDayEarly], now)
		const upcoming = groups.filter(
			(g) => g.title !== Constants.YESTERDAY && g.title !== Constants.TODAY,
		)
		expect(upcoming).toEqual([
			{title: formatDateString(new Date(2026, 0, 17)), data: [soonerDayEarly, soonerDayLate]},
			{title: formatDateString(new Date(2026, 0, 20)), data: [laterDay]},
		])
	})

	it('drops a game older than yesterday entirely', () => {
		const twoDaysAgo = new Date(2026, 0, 13, 9, 0, 0)
		const score = makeFakeScore(twoDaysAgo)
		const groups = groupScoresByDate([score], now)
		const allIds = groups.flatMap((g) => g.data)
		expect(allIds).toHaveLength(0)
	})
})

describe('sectionsForTab', () => {
	const ongoing = makeFakeScore(new Date(2026, 0, 15), {status: {indicator: 'O'}})
	const finalized = makeFakeScore(new Date(2026, 0, 15), {status: {indicator: 'A'}, result: 'W'})
	const upcomingGame = makeFakeScore(new Date(2026, 0, 15), {status: {indicator: 'A'}, result: ''})

	it('splits Today into Ongoing, Finalized, and Upcoming, omitting empty sections', () => {
		const grouped: DateGroupedScores[] = [
			{title: Constants.YESTERDAY, data: []},
			{title: Constants.TODAY, data: [finalized, ongoing]},
		]
		const sections = sectionsForTab(Constants.TODAY, grouped)
		expect(sections).toEqual([
			{title: Constants.ONGOING, data: [ongoing]},
			{title: Constants.FINALIZED, data: [finalized]},
		])
	})

	it('includes all three Today sections when every bucket has a game', () => {
		const grouped: DateGroupedScores[] = [
			{title: Constants.YESTERDAY, data: []},
			{title: Constants.TODAY, data: [ongoing, finalized, upcomingGame]},
		]
		const sections = sectionsForTab(Constants.TODAY, grouped)
		expect(sections.map((s) => s.title)).toEqual([
			Constants.ONGOING,
			Constants.FINALIZED,
			Constants.UPCOMING,
		])
	})

	it('includes a Yesterday game with no posted result', () => {
		const withResult = makeFakeScore(new Date(2026, 0, 14), {result: 'W'})
		const noResult = makeFakeScore(new Date(2026, 0, 14), {result: ''})
		const grouped: DateGroupedScores[] = [
			{title: Constants.YESTERDAY, data: [withResult, noResult]},
			{title: Constants.TODAY, data: []},
		]
		const sections = sectionsForTab(Constants.YESTERDAY, grouped)
		expect(sections).toEqual([{title: '', data: [withResult, noResult]}])
	})

	it('returns no sections for Yesterday when the bucket is empty', () => {
		const grouped: DateGroupedScores[] = [
			{title: Constants.YESTERDAY, data: []},
			{title: Constants.TODAY, data: []},
		]
		expect(sectionsForTab(Constants.YESTERDAY, grouped)).toEqual([])
	})

	it('strips the Yesterday and Today buckets for Upcoming', () => {
		const upcomingSection = {title: 'Monday, January 19', data: [upcomingGame]}
		const grouped: DateGroupedScores[] = [
			{title: Constants.YESTERDAY, data: [finalized]},
			{title: Constants.TODAY, data: [ongoing]},
			upcomingSection,
		]
		expect(sectionsForTab(Constants.UPCOMING, grouped)).toEqual([upcomingSection])
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

describe('filterSectionsBySport', () => {
	// filterSectionsBySport only reads `sport`, so the date on each fake score
	// is arbitrary — fixed here rather than built from `new Date()`.
	const day = new Date(2026, 0, 15)
	const baseball = makeFakeScore(day, {sport: 'Baseball'})
	const golf = makeFakeScore(day, {sport: "Men's Golf"})
	const soccer = makeFakeScore(day, {sport: "Women's Soccer"})

	it('returns every game when the selection is empty', () => {
		const grouped: DateGroupedScores[] = [{title: Constants.TODAY, data: [baseball, golf, soccer]}]
		expect(filterSectionsBySport(grouped, [])).toEqual(grouped)
	})

	it('keeps only games whose sport is in a non-empty selection', () => {
		const grouped: DateGroupedScores[] = [{title: Constants.TODAY, data: [baseball, golf, soccer]}]
		const result = filterSectionsBySport(grouped, ['Baseball'])
		expect(result).toEqual([{title: Constants.TODAY, data: [baseball]}])
	})

	it('keeps a section, with empty data, when filtering removes every game in it', () => {
		const grouped: DateGroupedScores[] = [{title: Constants.TODAY, data: [golf]}]
		const result = filterSectionsBySport(grouped, ['Baseball'])
		expect(result).toEqual([{title: Constants.TODAY, data: []}])
	})

	it('leaves matching games untouched when the selection also names a sport absent from the data', () => {
		const grouped: DateGroupedScores[] = [{title: Constants.TODAY, data: [baseball]}]
		const result = filterSectionsBySport(grouped, ['Baseball', 'Fencing'])
		expect(result).toEqual([{title: Constants.TODAY, data: [baseball]}])
	})
})
