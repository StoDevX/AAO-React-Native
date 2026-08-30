import {toProcessedScores, groupScoresByDate, formatDateString} from '../utils'
import {Constants} from '../constants'
import {ProcessedScore, Score} from '../types'

const makeFakeScore = (
	parsedDate: Date,
	extra: Partial<{sport: string; result: string}> = {},
): ProcessedScore =>
	({
		id: '1',
		date_utc: parsedDate.toISOString(),
		sport: extra.sport ?? 'Baseball',
		result: extra.result ?? '',
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
	it('places a past game in Yesterday bucket', () => {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		const score = makeFakeScore(yesterday)
		const groups = groupScoresByDate([score])
		const yGroup = groups.find((g) => g.title === Constants.YESTERDAY)
		expect(yGroup?.data).toHaveLength(1)
	})

	it('places a today game in Today bucket', () => {
		const today = new Date()
		const score = makeFakeScore(today)
		const groups = groupScoresByDate([score])
		const todayGroup = groups.find((g) => g.title === Constants.TODAY)
		expect(todayGroup?.data).toHaveLength(1)
	})
})
