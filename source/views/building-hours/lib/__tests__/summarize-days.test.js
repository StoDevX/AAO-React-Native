// @flow
import {summarizeDays} from '../summarize-days'

describe('returns a single day if only a single day is given', () => {
	let allDays = [
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
})

describe('returns common shorthands for common day spans', () => {
	test('handles "weekdays"', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr'])
		expect(actual).toEqual('Weekdays')
	})

	test('handles "weekends"', () => {
		let actual = summarizeDays(['Sa', 'Su'])
		expect(actual).toEqual('Weekend')
	})

	test('handles "every day"', () => {
		let actual = summarizeDays(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
		expect(actual).toEqual('Every day')
	})
})
