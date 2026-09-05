import {describe, expect, test} from '@jest/globals'

import {deriveDayFlags, type EventType} from '@frogpond/event-type'
import moment from 'moment'
import {
	detailTimes,
	detailTimeLines,
	formatHourLabel,
	formatSectionHeader,
	listTimeLines,
	times,
} from '../times'

/**
 * What every parser writes for an all-day event: neither edge carries a
 * meaningful time.
 */
const ALL_DAY = {startTime: false, endTime: false, subtitle: 'description'} as const

describe('allDay', () => {
	// `isAllDay` is each source's own statement, independent of the actual
	// clock times. `config` is unrelated here -- times()/detailTimes() never
	// read it -- so it's a fixed placeholder, not derived from `isAllDay`.
	function generateEvent(start: string, end: string, isAllDay = true) {
		let startTime = moment(start)
		let endTime = moment(end)
		let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

		return {
			title: 'title',
			description: 'description',
			startTime,
			endTime,
			isAllDay,
			isMultiDay,
			isSameInstant,
			location: 'location',
			isOngoing: false,
			links: [],
			categories: [],
			config: {startTime: true, endTime: true, subtitle: 'description'},
		} satisfies EventType
	}

	test('should be true for a remote midnight-to-midnight event', () => {
		const event = generateEvent('2018-08-07T00:00:00Z', '2018-08-08T00:00:00Z')

		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	// `times()`/`detailTimes()` must read `allDay` straight off the event, never
	// infer it from the clock times themselves.
	test('should be true for a noon-to-noon event whose source called it all-day', () => {
		const event = generateEvent('2018-08-07T12:00:00Z', '2018-08-08T12:00:00Z')
		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	// EventKit's own all-day span, which is 23.9997 hours rather than 24 -- so
	// nothing may read all-day off the duration.
	test('should be true for an EventKit all-day event ending at 23:59:59', () => {
		const event = generateEvent('2026-09-07T00:00:00', '2026-09-07T23:59:59')
		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	test('should be false when the source gave the event real times', () => {
		const event = generateEvent('2018-08-07T12:00:00Z', '2018-08-08T12:30:00Z', false)
		expect(times(event).allDay).toBe(false)
		expect(detailTimes(event).allDay).toBe(false)
	})

	// A full 24 hours is not all-day if the source gave both edges a time.
	test('should be false for a timed event that happens to run 24 hours', () => {
		const event = generateEvent('2018-08-07T12:00:00Z', '2018-08-08T12:00:00Z', false)
		expect(times(event).allDay).toBe(false)
		expect(detailTimes(event).allDay).toBe(false)
	})
})

describe('ongoing events', () => {
	function generateOngoingEvent(start: string, end: string): EventType {
		let startTime = moment(start)
		let endTime = moment(end)
		let config = {startTime: true, endTime: true, subtitle: 'description' as const}
		let isAllDay = !config.startTime && !config.endTime
		let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

		return {
			title: 'title',
			description: 'description',
			startTime,
			endTime,
			isAllDay,
			isMultiDay,
			isSameInstant,
			location: 'location',
			isOngoing: true,
			links: [],
			categories: [],
			config,
		}
	}

	test('should be formatted', () => {
		const event = generateOngoingEvent('2018-08-07T12:00:00Z', '2018-08-07T15:00:00Z')
		expect(times(event)).toMatchSnapshot()
		expect(detailTimes(event)).toMatchSnapshot()
	})
})

// multi-day events

// zero-length events

// midnight and noon
// events starting at midnight
// ... ending
// starting ... noon
// ... ending

// unremarkable events

// and they can all test times and detailTimes right next to each other -
// no need for separate testcases.

describe('detailTimeLines', () => {
	function generateEvent(
		start: string,
		end: string,
		overrides: Partial<EventType> = {},
	): EventType {
		let startTime = moment(start)
		let endTime = moment(end)
		// An ordinary event, with both edges meaningful. The all-day cases
		// override `config`, which is what says all-day.
		let config = overrides.config ?? {
			startTime: true,
			endTime: true,
			subtitle: 'description' as const,
		}
		let isAllDay = !config.startTime && !config.endTime
		let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

		return {
			title: 'title',
			description: 'description',
			startTime,
			endTime,
			isAllDay,
			isMultiDay,
			isSameInstant,
			location: 'location',
			isOngoing: false,
			links: [],
			categories: [],
			config,
			...overrides,
		}
	}

	test('an ordinary event gets a From line and a to line (en-US, 12-hour)', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00')

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'From', time: '7:45 AM', date: 'Monday, August 17, 2026'},
			{prefix: 'to', time: '6 PM', date: 'Thursday, August 20, 2026'},
		])
	})

	test('an ordinary event gets a From line and a to line (en-GB, 24-hour)', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00')

		expect(detailTimeLines(event, 'en-GB')).toEqual([
			{prefix: 'From', time: '07:45', date: 'Monday, 17 August 2026'},
			{prefix: 'to', time: '18:00', date: 'Thursday, 20 August 2026'},
		])
	})

	// Only where a meridiem carries the hour. `From 15 Wednesday, 19 August`
	// does not read as a time, so 24-hour locales keep the `:00`.
	test('drops the minutes on the hour only where there is a meridiem', () => {
		let event = generateEvent('2026-08-17T06:00:00', '2026-08-17T07:00:00')

		let [start] = detailTimeLines(event, 'en-US')
		expect(start.time).toBe('6 AM')

		let [startGB] = detailTimeLines(event, 'en-GB')
		expect(startGB.time).toBe('06:00')
	})

	test('keeps the minutes when they are non-zero', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T08:00:00')

		let [start] = detailTimeLines(event, 'en-US')
		expect(start.time).toBe('7:45 AM')
	})

	test('an all-day event gets a single All day line with no time', () => {
		let event = generateEvent('2026-08-17T00:00:00', '2026-08-18T00:00:00', {config: ALL_DAY})

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'All day', time: '', date: 'Monday, August 17, 2026'},
		])
	})

	// EventKit's 00:00:00-23:59:59 span must reach the all-day branch: falling
	// past it renders `From 12 AM ... to 11:59 PM ...`.
	test('an EventKit all-day event gets the same single All day line', () => {
		let event = generateEvent('2026-09-07T00:00:00', '2026-09-07T23:59:59', {config: ALL_DAY})

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'All day', time: '', date: 'Monday, September 7, 2026'},
		])
	})

	// An all-day event's end is exclusive on the web and inclusive from
	// EventKit, so both of these cover Sep 7 through Sep 9 and must read alike.
	test.each([
		['a remote', '2026-09-10T00:00:00'],
		['an EventKit', '2026-09-09T23:59:59'],
	])('%s multi-day all-day event names both of its days', (_label, end) => {
		let event = generateEvent('2026-09-07T00:00:00', end, {config: ALL_DAY})

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'All day from', time: '', date: 'Monday, September 7, 2026'},
			{prefix: 'to', time: '', date: 'Wednesday, September 9, 2026'},
		])
	})

	test('an ongoing event gets dates without times', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00', {isOngoing: true})

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'From', time: '', date: 'Monday, August 17, 2026'},
			{prefix: 'to', time: '', date: 'Thursday, August 20, 2026'},
		])
	})

	test('a zero-length event gets a single line with no to', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T07:45:00')

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: '', time: '7:45 AM', date: 'Monday, August 17, 2026'},
		])
	})

	test('defaults to the device locale when none is passed', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T08:00:00')

		// Node's default locale in this test environment is en-US.
		let [start] = detailTimeLines(event)
		expect(start.time).toBe('7:45 AM')
	})
})

describe('listTimeLines', () => {
	function generateEvent(
		start: string,
		end: string,
		overrides: Partial<EventType> = {},
	): EventType {
		let startTime = moment(start)
		let endTime = moment(end)
		// An ordinary event, with both edges meaningful. The all-day cases
		// override `config`, which is what says all-day.
		let config = overrides.config ?? {
			startTime: true,
			endTime: true,
			subtitle: 'description' as const,
		}
		let isAllDay = !config.startTime && !config.endTime
		let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

		return {
			title: 'title',
			description: 'description',
			startTime,
			endTime,
			isAllDay,
			isMultiDay,
			isSameInstant,
			location: 'location',
			isOngoing: false,
			links: [],
			categories: [],
			config,
			...overrides,
		}
	}

	test('an ordinary event gets a start and an end (en-US, 12-hour)', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T11:30:00')

		expect(listTimeLines(event, 'en-US')).toEqual({
			start: '7:45 AM',
			end: '11:30 AM',
			allDay: false,
		})
	})

	test('an ordinary event gets a start and an end (en-GB, 24-hour)', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T11:30:00')

		expect(listTimeLines(event, 'en-GB')).toEqual({
			start: '07:45',
			end: '11:30',
			allDay: false,
		})
	})

	test('keeps the minutes on the hour in a 24-hour locale', () => {
		let event = generateEvent('2026-08-17T10:00:00', '2026-08-17T11:00:00')

		expect(listTimeLines(event, 'en-GB')).toEqual({
			start: '10:00',
			end: '11:00',
			allDay: false,
		})
	})

	test('drops the minutes on the hour in a 12-hour locale', () => {
		let event = generateEvent('2026-08-17T06:00:00', '2026-08-17T07:00:00')

		expect(listTimeLines(event, 'en-US')).toEqual({
			start: '6 AM',
			end: '7 AM',
			allDay: false,
		})
	})

	test('an all-day event has no start or end text', () => {
		let event = generateEvent('2026-08-17T00:00:00', '2026-08-18T00:00:00', {config: ALL_DAY})

		expect(listTimeLines(event, 'en-US')).toEqual({start: '', end: '', allDay: true})
	})

	// What the list row turns into its `all-day` label, so EventKit's span has
	// to be recognised here as well as in the detail lines.
	test('an EventKit all-day event is all-day here too', () => {
		let event = generateEvent('2026-09-07T00:00:00', '2026-09-07T23:59:59', {config: ALL_DAY})

		expect(listTimeLines(event, 'en-US')).toEqual({start: '', end: '', allDay: true})
	})

	test('an ongoing event gets dates, not times', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00', {isOngoing: true})

		expect(listTimeLines(event, 'en-US')).toEqual({
			start: 'Aug 17',
			end: 'Aug 20',
			allDay: false,
		})
	})

	test('a multi-day event gets a start time and an end date with a time', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00')

		expect(listTimeLines(event, 'en-US')).toEqual({
			start: '7:45 AM',
			end: 'Aug 20, 6 PM',
			allDay: false,
		})
	})

	test('a multi-day event gets a start time and an end date with a time (en-GB, 24-hour)', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-20T18:00:00')

		expect(listTimeLines(event, 'en-GB')).toEqual({
			start: '07:45',
			end: '20 Aug, 18:00',
			allDay: false,
		})
	})

	test('a zero-length event has a start and no end', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T07:45:00')

		expect(listTimeLines(event, 'en-US')).toEqual({start: '7:45 AM', end: '', allDay: false})
	})
})

describe('formatHourLabel', () => {
	test('a 12-hour locale gets a bare hour and meridiem (en-US)', () => {
		let hour = moment('2026-08-17T09:00:00')
		expect(formatHourLabel(hour, 'en-US')).toBe('9 AM')
	})

	test('a 24-hour locale gets a padded, minute-bearing hour (en-GB)', () => {
		let hour = moment('2026-08-17T09:00:00')
		expect(formatHourLabel(hour, 'en-GB')).toBe('09:00')
	})
})

describe('formatSectionHeader', () => {
	test('weekday and short date, en dash separated (en-US)', () => {
		let date = moment('2026-08-16T00:00:00')
		expect(formatSectionHeader(date, 'en-US')).toBe('Sunday – Aug 16')
	})

	test('weekday and short date, en dash separated (en-GB)', () => {
		let date = moment('2026-08-16T00:00:00')
		expect(formatSectionHeader(date, 'en-GB')).toBe('Sunday – 16 Aug')
	})
})
