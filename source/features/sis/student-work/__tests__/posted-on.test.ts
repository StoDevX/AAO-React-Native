import {postedOn} from '../lib'

describe('postedOn', () => {
	test('shows the posted date with a short month', () => {
		expect(postedOn('2026-08-14', 'en-US')).toBe('Posted Aug 14, 2026')
	})

	test('orders the date the way the reader’s locale does', () => {
		expect(postedOn('2026-08-14', 'en-GB')).toBe('Posted 14 Aug 2026')
	})

	test('shows nothing for a posted date it cannot read', () => {
		expect(postedOn('')).toBeUndefined()
		expect(postedOn('not a date')).toBeUndefined()
	})

	/// `PostedDate` carries no zone, so parsing it as UTC would roll the date
	/// back a day for every reader west of Greenwich -- St. Olaf included.
	test('reads the date as local time, not UTC', () => {
		expect(postedOn('2026-01-01', 'en-US')).toBe('Posted Jan 1, 2026')
	})
})
