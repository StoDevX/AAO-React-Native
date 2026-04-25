import {parseGameDate, groupScoresByDate, formatDateString} from '../utils'
import {Constants} from '../constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeFakeScore = (date_utc: string, extra: Partial<{sport: string; result: string}> = {}): any => ({
	id: '1',
	date_utc,
	sport: extra.sport ?? 'Baseball',
	result: extra.result ?? '',
	// minimal fields — only what utils needs
})

describe('parseGameDate', () => {
	it('parses a standard date string', () => {
		const d = parseGameDate('1/26/2025 1:00:00 PM')
		expect(d.getFullYear()).toBe(2025)
		expect(d.getMonth()).toBe(0) // January
		expect(d.getDate()).toBe(26)
		expect(d.getHours()).toBe(13)
	})

	it('parses midnight', () => {
		const d = parseGameDate('6/1/2025 12:00:00 AM')
		expect(d.getHours()).toBe(0)
	})

	it('parses noon', () => {
		const d = parseGameDate('6/1/2025 12:00:00 PM')
		expect(d.getHours()).toBe(12)
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
