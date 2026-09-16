import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import {formatHourLabel, formatTime, localeWithHourCycle} from '../index'

const CAMPUS = 'America/Chicago'

describe('localeWithHourCycle', () => {
	test('forces 24-hour', () => {
		expect(localeWithHourCycle('en-US', true)).toBe('en-US-u-hc-h23')
	})

	test('forces 12-hour', () => {
		expect(localeWithHourCycle('ja-JP', false)).toBe('ja-JP-u-hc-h12')
	})

	test('leaves the tag alone when the OS preference is unknown', () => {
		expect(localeWithHourCycle('en-US', null)).toBe('en-US')
	})
})

describe('formatTime', () => {
	test('drops :00 on the hour where the locale has a meridiem', () => {
		let m = moment.tz('2026-08-20 17:00', CAMPUS)
		expect(formatTime(m, 'en-US')).toBe('5 PM')
	})

	test('keeps the minutes off the hour', () => {
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, 'en-US')).toBe('5:30 PM')
	})

	test('pads the hour and keeps :00 in a 24-hour locale', () => {
		let m = moment.tz('2026-08-20 06:00', CAMPUS)
		expect(formatTime(m, 'en-GB')).toBe('06:00')
	})

	test('honours a 24-hour override composed onto an otherwise 12-hour locale', () => {
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, localeWithHourCycle('en-US', true))).toBe('17:30')
	})

	test('formats in Japanese', () => {
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, 'ja-JP')).toBe('17:30')
	})

	test('formats a zoned moment in its own zone, not the process zone', () => {
		// 17:30 in Chicago is 22:30 UTC; if the zone were dropped, TZ=UTC in CI
		// would print 10:30 PM.
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, 'en-US')).toBe('5:30 PM')
		expect(formatTime(m.clone().utc(), 'en-US')).toBe('10:30 PM')
	})

	test('formats an unzoned moment in the process zone', () => {
		let m = moment('2026-08-20T17:30:00')
		expect(formatTime(m, 'en-US')).toBe('5:30 PM')
	})
})

describe('formatHourLabel', () => {
	test('a 12-hour locale gets a bare hour and meridiem', () => {
		expect(formatHourLabel(moment.tz('2026-08-20 09:00', CAMPUS), 'en-US')).toBe('9 AM')
	})

	test('a 24-hour locale gets a padded, minute-bearing hour', () => {
		expect(formatHourLabel(moment.tz('2026-08-20 09:00', CAMPUS), 'en-GB')).toBe('09:00')
	})
})
