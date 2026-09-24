import {formatPostedDate} from '../lib'

describe('formatPostedDate', () => {
	test('writes a date-only posted date with a short month', () => {
		expect(formatPostedDate('2026-08-14', 'en-US')).toBe('Aug 14, 2026')
	})

	test('writes a detail response’s timestamp as the same kind of date', () => {
		expect(formatPostedDate('2026-08-14T16:43:34+00:00', 'en-US')).toBe('Aug 14, 2026')
	})

	test('follows the reader’s locale', () => {
		expect(formatPostedDate('2026-08-14', 'en-GB')).toBe('14 Aug 2026')
	})

	test('gives nothing for a date it cannot read', () => {
		expect(formatPostedDate(undefined)).toBeUndefined()
		expect(formatPostedDate('not a date')).toBeUndefined()
	})
})
