/* eslint-env jest */

import {age} from './index'

test('returns the proper number of milliseconds in a second', () => {
	expect(age.seconds(1)).toBe(1000)
})

test('returns the proper number of milliseconds in a minute', () => {
	expect(age.minutes(1)).toBe(60000)
})

test('returns the proper number of milliseconds in an hour', () => {
	expect(age.hours(1)).toBe(3600000)
})

test('returns the proper number of milliseconds in a day', () => {
	expect(age.days(1)).toBe(86400000)
})

test('returns the proper number of milliseconds in a week', () => {
	expect(age.weeks(1)).toBe(604800000)
})

test('returns the proper number of milliseconds in a month', () => {
	expect(age.months(1)).toBe(2419200000)
})

test('returns the proper number of milliseconds in a year', () => {
	expect(age.years(1)).toBe(29030400000)
})
