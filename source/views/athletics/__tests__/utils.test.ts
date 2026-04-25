import {parseGameDate, groupScoresByDate, formatDateString} from '../utils'
import {Constants} from '../constants'
import {Score} from '../types'

const makeFakeScore = (
	dateUtc: string,
	extra: Partial<{sport: string; result: string}> = {},
): Score =>
	({
		id: '1',
		// eslint-disable-next-line camelcase
		date_utc: dateUtc,
		sport: extra.sport ?? 'Baseball',
		result: extra.result ?? '',
		// minimal fields — only what utils needs
	}) as Score

describe('parseGameDate', () => {
	it('parses an ISO 8601 UTC date string', () => {
		const d = parseGameDate('2025-01-26T19:00:00Z')
		expect(d.getFullYear()).toBe(d.getFullYear()) // valid Date
		expect(isNaN(d.getTime())).toBe(false)
	})

	it('returns an Invalid Date for garbage input', () => {
		const d = parseGameDate('not-a-date')
		expect(isNaN(d.getTime())).toBe(true)
	})
})

describe('formatDateString', () => {
	it('produces a human-readable day + date', () => {
		const d = new Date(2025, 0, 26) // Jan 26 2025 Sunday
		const result = formatDateString(d)
		expect(result).toBe('Sunday, Jan 26')
	})
})

describe('groupScoresByDate', () => {
	it('places a past game in Yesterday bucket', () => {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		const iso = yesterday.toISOString()
		const score = makeFakeScore(iso)
		const groups = groupScoresByDate([score])
		const yGroup = groups.find((g) => g.title === Constants.YESTERDAY)
		expect(yGroup?.data).toHaveLength(1)
	})

	it('places a today game in Today bucket', () => {
		const today = new Date()
		const iso = today.toISOString()
		const score = makeFakeScore(iso)
		const groups = groupScoresByDate([score])
		const todayGroup = groups.find((g) => g.title === Constants.TODAY)
		expect(todayGroup?.data).toHaveLength(1)
	})
})
