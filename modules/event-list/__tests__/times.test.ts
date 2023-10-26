import type {EventType} from '@frogpond/event-type'

import {detailTimes, times} from '../times'
import {describe, expect, test} from '@jest/globals'
import moment from 'moment'

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
		const event = generateOngoingEvent(
			'2018-08-07T12:00:00Z',
			'2018-08-07T15:00:00Z',
		)
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
