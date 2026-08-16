import {describe, expect, test} from '@jest/globals'

import type {EventType} from '@frogpond/event-type'
import moment from 'moment'
import {detailTimes, detailTimeLines, times} from '../times'

describe('allDay', () => {
	function generateEvent(start: string, end: string): EventType {
		return {
			title: 'title',
			description: 'description',
			startTime: moment(start),
			endTime: moment(end),
			location: 'location',
			isOngoing: false,
			links: [],
			config: {
				startTime: false,
				endTime: false,
				subtitle: 'description',
			},
		}
	}

	test('should be true for a midnight-to-midnight event', () => {
		const event = generateEvent('2018-08-07T00:00:00Z', '2018-08-08T00:00:00Z')

		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	test('should be true for a noon-to-noon event', () => {
		const event = generateEvent('2018-08-07T12:00:00Z', '2018-08-08T12:00:00Z')
		expect(times(event).allDay).toBe(true)
		expect(detailTimes(event).allDay).toBe(true)
	})

	test('should be false for a non-24 hour event', () => {
		const event = generateEvent('2018-08-07T12:00:00Z', '2018-08-08T12:30:00Z')
		expect(times(event).allDay).toBe(false)
		expect(detailTimes(event).allDay).toBe(false)
	})
})

describe('ongoing events', () => {
	function generateOngoingEvent(start: string, end: string): EventType {
		return {
			title: 'title',
			description: 'description',
			startTime: moment(start),
			endTime: moment(end),
			location: 'location',
			isOngoing: true,
			links: [],
			config: {
				startTime: false,
				endTime: false,
				subtitle: 'description',
			},
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
		return {
			title: 'title',
			description: 'description',
			startTime: moment(start),
			endTime: moment(end),
			location: 'location',
			isOngoing: false,
			links: [],
			config: {
				startTime: false,
				endTime: false,
				subtitle: 'description',
			},
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
			{prefix: 'From', time: '7:45', date: 'Monday, 17 August 2026'},
			{prefix: 'to', time: '18', date: 'Thursday, 20 August 2026'},
		])
	})

	test('drops the minutes when they are zero, in both clocks', () => {
		let event = generateEvent('2026-08-17T06:00:00', '2026-08-17T07:00:00')

		let [start] = detailTimeLines(event, 'en-US')
		expect(start.time).toBe('6 AM')

		let [startGB] = detailTimeLines(event, 'en-GB')
		expect(startGB.time).toBe('06')
	})

	test('keeps the minutes when they are non-zero', () => {
		let event = generateEvent('2026-08-17T07:45:00', '2026-08-17T08:00:00')

		let [start] = detailTimeLines(event, 'en-US')
		expect(start.time).toBe('7:45 AM')
	})

	test('an all-day event gets a single All day line with no time', () => {
		let event = generateEvent('2026-08-17T00:00:00', '2026-08-18T00:00:00')

		expect(detailTimeLines(event, 'en-US')).toEqual([
			{prefix: 'All day', time: '', date: 'Monday, August 17, 2026'},
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
