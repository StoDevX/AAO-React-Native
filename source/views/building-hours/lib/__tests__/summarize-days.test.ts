import {DayOfWeekEnumType} from '../../types'
import {summarizeDays, summarizeDaysAndHours} from '../summarize-days'
import {describe, expect, test} from '@jest/globals'

describe('returns a single day if only a single day is given', () => {
	let allDays: [DayOfWeekEnumType, string][] = [
		['Su', 'Sunday'],
		['Mo', 'Monday'],
		['Tu', 'Tuesday'],
		['We', 'Wednesday'],
		['Th', 'Thursday'],
		['Fr', 'Friday'],
		['Sa', 'Saturday'],
	]

	for (let [abbr, full] of allDays) {
		test(`returns ${full} for ${abbr}`, () => {
			let actual = summarizeDays([abbr])

			expect(actual).toEqual(full)
		})
	}
})

describe('returns the provided days if non-contiguous', () => {
	test('handles a two-day set', () => {
		let actual = summarizeDays(['Mo', 'We'])
		expect(actual).toEqual('Mo, We')
	})
	test('handles a three-day set', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'Th'])
		expect(actual).toEqual('Mo, Tu, Th')
	})
	test('handles a four-day set', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'Th', 'Fr'])
		expect(actual).toEqual('Mo, Tu, Th, Fr')
	})
	test('handles a five-day set', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Fr', 'Su'])
		expect(actual).toEqual('Mo, Tu, We, Fr, Su')
	})
	test('handles a six-day set', () => {
		let actual = summarizeDays(['Mo', 'We', 'Th', 'Fr', 'Sa', 'Su'])
		expect(actual).toEqual('Mo, We, Th, Fr, Sa, Su')
	})

	test('handles a two-day set (full)', () => {
		let actual = summarizeDays(['Mo', 'We'], true)
		expect(actual).toEqual('Monday and Wednesday')
	})
	test('handles a three-day set (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'Th'], true)
		expect(actual).toEqual('Monday, Tuesday, and Thursday')
	})
	test('handles a four-day set (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'Th', 'Fr'], true)
		expect(actual).toEqual('Monday, Tuesday, Thursday, and Friday')
	})
	test('handles a five-day set (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Fr', 'Su'], true)
		expect(actual).toEqual('Monday, Tuesday, Wednesday, Friday, and Sunday')
	})
	test('handles a six-day set (full)', () => {
		let actual = summarizeDays(['Mo', 'We', 'Th', 'Fr', 'Sa', 'Su'], true)
		expect(actual).toEqual(
			'Monday, Wednesday, Thursday, Friday, Saturday, and Sunday',
		)
	})
})

describe('returns the spanned days if a span of days are given', () => {
	test('handles a two-day span', () => {
		let actual = summarizeDays(['Mo', 'Tu'])
		expect(actual).toEqual('Mon — Tue')
	})

	test('handles a three-day span', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We'])
		expect(actual).toEqual('Mon — Wed')
	})

	test('handles a four-day span', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th'])
		expect(actual).toEqual('Mon — Thu')
	})

	test('handles a five-day span', () => {
		let actual = summarizeDays(['Tu', 'We', 'Th', 'Fr', 'Sa'])
		expect(actual).toEqual('Tue — Sat')
	})

	test('handles a six-day span', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])
		expect(actual).toEqual('Mon — Sat')
	})

	test('handles a two-day span (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu'], true)
		expect(actual).toEqual('Monday — Tuesday')
	})

	test('handles a three-day span (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We'], true)
		expect(actual).toEqual('Monday — Wednesday')
	})

	test('handles a four-day span (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th'], true)
		expect(actual).toEqual('Monday — Thursday')
	})

	test('handles a five-day span (full)', () => {
		let actual = summarizeDays(['Tu', 'We', 'Th', 'Fr', 'Sa'], true)
		expect(actual).toEqual('Tuesday — Saturday')
	})

	test('handles a six-day span (full)', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], true)
		expect(actual).toEqual('Monday — Saturday')
	})
})

describe('returns common shorthands for common day spans', () => {
	test('handles "weekdays"', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr'])
		expect(actual).toEqual('Weekdays')
	})

	test('handles "weekends"', () => {
		let actual = summarizeDays(['Sa', 'Su'])
		expect(actual).toEqual('Weekends')
	})

	test('handles "every day"', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
		expect(actual).toEqual('Every day')
	})
})

describe('returns summary for combination days and hours', () => {
	test('handles "every day"', () => {
		let actual = summarizeDaysAndHours({
			days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
			from: '9:00am',
			to: '5:00pm',
		})
		expect(actual).toEqual('Opens at 9:00am and closes at 5:00pm every day.')
	})

	test('handles "weekends"', () => {
		let actual = summarizeDaysAndHours({
			days: ['Sa', 'Su'],
			from: '9:00am',
			to: '5:00pm',
		})
		expect(actual).toEqual('Opens at 9:00am and closes at 5:00pm on Weekends.')
	})

	test('handles "single day"', () => {
		let actual = summarizeDaysAndHours({
			days: ['Mo'],
			from: '9:00am',
			to: '5:00pm',
		})
		expect(actual).toEqual('Opens at 9:00am and closes at 5:00pm every Monday.')
	})

	test('handles "consecutive days"', () => {
		let actual = summarizeDaysAndHours({
			days: ['Mo', 'Tu', 'We', 'Th'],
			from: '9:00am',
			to: '5:00pm',
		})
		expect(actual).toEqual(
			'Opens at 9:00am and closes at 5:00pm every Monday — Thursday.',
		)
	})

	test('handles "non-consecutive days"', () => {
		let actual = summarizeDaysAndHours({
			days: ['Mo', 'We', 'Sa'],
			from: '9:00am',
			to: '5:00pm',
		})
		expect(actual).toEqual(
			'Opens at 9:00am and closes at 5:00pm every Monday, Wednesday, and Saturday.',
		)
	})
})
