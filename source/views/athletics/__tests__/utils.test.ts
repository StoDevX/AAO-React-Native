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
	it('parses the API date format correctly', () => {
		const d = parseGameDate('1/26/2025 1:00:00 PM')
		expect(d.getFullYear()).toBe(2025)
		expect(d.getMonth()).toBe(0) // January
		expect(d.getDate()).toBe(26)
		expect(d.getHours()).toBe(13)
	})

	it('parses midnight (AM)', () => {
		const d = parseGameDate('6/1/2025 12:00:00 AM')
		expect(d.getHours()).toBe(0)
	})

	it('parses noon (PM)', () => {
		const d = parseGameDate('6/1/2025 12:00:00 PM')
		expect(d.getHours()).toBe(12)
	})

	it('returns Invalid Date for garbage input', () => {
		const d = parseGameDate('not-a-date')
		expect(isNaN(d.getTime())).toBe(true)
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
		const m = yesterday.getMonth() + 1
		const d = yesterday.getDate()
		const y = yesterday.getFullYear()
		const score = makeFakeScore(`${m}/${d}/${y} 1:00:00 PM`)
		const groups = groupScoresByDate([score])
		const yGroup = groups.find((g) => g.title === Constants.YESTERDAY)
		expect(yGroup?.data).toHaveLength(1)
	})

	it('places a today game in Today bucket', () => {
		const today = new Date()
		const m = today.getMonth() + 1
		const d = today.getDate()
		const y = today.getFullYear()
		const score = makeFakeScore(`${m}/${d}/${y} 1:00:00 PM`)
		const groups = groupScoresByDate([score])
		const todayGroup = groups.find((g) => g.title === Constants.TODAY)
		expect(todayGroup?.data).toHaveLength(1)
	})
})
