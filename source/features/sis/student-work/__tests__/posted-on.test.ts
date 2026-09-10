import {postedOn} from '../lib'

describe('postedOn', () => {
	test('shows the posted date in long form', () => {
		expect(postedOn('2026-08-14')).toBe('Posted August 14, 2026')
	})

	test('shows nothing for a posted date it cannot read', () => {
		expect(postedOn('')).toBeUndefined()
		expect(postedOn('not a date')).toBeUndefined()
	})

	/// `PostedDate` carries no zone, so parsing it as UTC would roll the date
	/// back a day for every reader west of Greenwich -- St. Olaf included.
	test('reads the date as local time, not UTC', () => {
		expect(postedOn('2026-01-01')).toBe('Posted January 1, 2026')
	})
})
