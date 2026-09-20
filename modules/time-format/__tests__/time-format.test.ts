import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import {
	formatDate,
	formatDateTime,
	formatDayOfMonth,
	formatHourLabel,
	formatTime,
	formatWeekday,
	localeWithHourCycle,
} from '../index'

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

	test('extends an existing -u- extension rather than doubling it', () => {
		// Settings → General → Language & Region → Calendar puts a `-u-ca-`
		// keyword in the language tag `expo-localization` reports. Appending
		// a second `-u-` block produces an invalid BCP47 tag that crashes
		// every `Intl.DateTimeFormat` call using it.
		let tag = localeWithHourCycle('ja-JP-u-ca-japanese', true)
		expect(tag).toBe('ja-JP-u-ca-japanese-hc-h23')
		expect(() => new Intl.DateTimeFormat(tag, {hour: 'numeric'})).not.toThrow()
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

	test("converts to the device zone regardless of the moment's own zone label", () => {
		// Same real instant, two different zone labels. If the input’s own
		// zone were still preserved, these would render differently -- they
		// must not.
		let chicago = moment.tz('2026-08-20 17:30', CAMPUS)
		let tokyo = chicago.clone().tz('Asia/Tokyo')
		expect(formatTime(chicago, 'en-US')).toBe('5:30 PM')
		expect(formatTime(chicago, 'en-US')).toBe(formatTime(tokyo, 'en-US'))
	})

	test('formats an unzoned moment in the process zone', () => {
		let m = moment('2026-08-20T17:30:00')
		expect(formatTime(m, 'en-US')).toBe('5:30 PM')
	})

	test('renders in an explicit zone when one is asked for', () => {
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, 'en-US', 'America/New_York')).toBe('6:30 PM')
	})

	test('keeps the formatter cache keyed by zone', () => {
		// Same shape and locale, two zones. A cache keyed only on
		// shape-and-locale would hand the second call the first one's
		// formatter and render both in the same zone.
		let m = moment.tz('2026-08-20 17:30', CAMPUS)
		expect(formatTime(m, 'en-US', 'America/Chicago')).toBe('5:30 PM')
		expect(formatTime(m, 'en-US', 'America/New_York')).toBe('6:30 PM')
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

describe('formatDate', () => {
	let m = moment.tz('2026-08-20 17:30', CAMPUS)

	test('short: month and day in locale order', () => {
		expect(formatDate(m, 'short', 'en-US')).toBe('Aug 20')
		expect(formatDate(m, 'short', 'en-GB')).toBe('20 Aug')
		expect(formatDate(m, 'short', 'ja-JP')).toBe('8月20日')
	})

	// The weekday is what the menus' header adds: a reader glancing at a
	// cafe's menu wants to know it is today's without doing the arithmetic.
	test('medium: short weekday, month and day in locale order', () => {
		expect(formatDate(m, 'medium', 'en-US')).toBe('Thu, Aug 20')
		// No comma in en-GB, where `Intl` separates the weekday with a space.
		expect(formatDate(m, 'medium', 'en-GB')).toBe('Thu 20 Aug')
		expect(formatDate(m, 'medium', 'ja-JP')).toBe('8月20日(木)')
	})

	test('long: weekday, month, day and year', () => {
		expect(formatDate(m, 'long', 'en-US')).toBe('Thursday, August 20, 2026')
		expect(formatDate(m, 'long', 'en-GB')).toBe('Thursday, 20 August 2026')
		expect(formatDate(m, 'long', 'ja-JP')).toBe('2026年8月20日木曜日')
	})

	test("converts to the device zone regardless of the moment's own zone label", () => {
		// 23:30 Chicago is already the 21st in Tokyo. If the input’s own zone
		// were still preserved, the two would land on different calendar
		// days -- they must not.
		let chicago = moment.tz('2026-08-20 23:30', CAMPUS)
		let tokyo = chicago.clone().tz('Asia/Tokyo')
		expect(formatDate(chicago, 'short', 'en-US')).toBe('Aug 20')
		expect(formatDate(chicago, 'short', 'en-US')).toBe(formatDate(tokyo, 'short', 'en-US'))
	})
})

describe('formatDateTime', () => {
	let m = moment.tz('2026-08-20 17:30', CAMPUS)

	test('lets Intl join the date and the time', () => {
		expect(formatDateTime(m, 'en-US')).toBe('Aug 20, 2026, 5:30 PM')
		expect(formatDateTime(m, 'en-GB')).toBe('20 Aug 2026, 17:30')
		expect(formatDateTime(m, 'ja-JP')).toBe('2026/08/20 17:30')
	})

	test('honours a 24-hour override', () => {
		expect(formatDateTime(m, 'en-US-u-hc-h23')).toBe('Aug 20, 2026, 17:30')
	})
})

describe('formatWeekday', () => {
	let m = moment.tz('2026-08-20 17:30', CAMPUS)

	test('narrow, short and long', () => {
		expect(formatWeekday(m, 'narrow', 'en-US')).toBe('T')
		expect(formatWeekday(m, 'short', 'en-US')).toBe('Thu')
		expect(formatWeekday(m, 'long', 'en-US')).toBe('Thursday')
	})

	test('in Japanese', () => {
		expect(formatWeekday(m, 'narrow', 'ja-JP')).toBe('木')
		expect(formatWeekday(m, 'long', 'ja-JP')).toBe('木曜日')
	})
})

describe('formatDayOfMonth', () => {
	let m = moment.tz('2026-08-20 17:30', CAMPUS)

	test('uses the locale digits', () => {
		expect(formatDayOfMonth(m, 'en-US')).toBe('20')
		expect(formatDayOfMonth(m, 'ar-EG')).toBe('٢٠')
	})

	test('leaves off the day marker a locale would write after the number', () => {
		// A formatted date writes `20日` in Japanese and `20일` in Korean. The
		// day-picker strip draws this inside a fixed-width circle beneath a
		// weekday letter, where the marker is both redundant and too wide to
		// fit -- it clipped the number on the simulator.
		expect(formatDayOfMonth(m, 'ja-JP')).toBe('20')
		expect(formatDayOfMonth(m, 'ko-KR')).toBe('20')
	})

	test('counts the day in the moment’s own zone', () => {
		// 23:30 in Chicago is already the 21st in UTC.
		let late = moment.tz('2026-08-20 23:30', CAMPUS)
		expect(formatDayOfMonth(late, 'en-US')).toBe('20')
		expect(formatDayOfMonth(late.clone().utc(), 'en-US')).toBe('21')
	})
})
