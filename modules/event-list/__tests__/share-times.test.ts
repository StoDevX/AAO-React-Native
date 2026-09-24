import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import type {EventType} from '@frogpond/event-type'
import {formatDate} from '@frogpond/time-format'

import {getTimes} from '../calendar-util'

function allDay(start: string, end: string): EventType {
	return {
		title: 'Fall Break',
		description: '',
		location: '',
		startTime: moment(start),
		endTime: moment(end),
		isAllDay: true,
		isMultiDay: true,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: false, endTime: false, subtitle: 'location'},
	}
}

describe('getTimes, for an all-day event', () => {
	test('names the one day a single-day event covers', () => {
		let event = allDay('2026-10-16T00:00:00', '2026-10-17T00:00:00')
		expect(getTimes(event)).toBe(`All-Day on ${formatDate(event.startTime, 'short')}`)
	})

	test('names the first and last day of an event spanning several', () => {
		// Ends exclusively at the midnight after Oct 19, its last day.
		let event = allDay('2026-10-16T00:00:00', '2026-10-20T00:00:00')
		expect(getTimes(event)).toBe(
			`All-Day, ${formatDate(moment('2026-10-16T00:00:00'), 'short')} to ${formatDate(moment('2026-10-19T00:00:00'), 'short')}`,
		)
	})
})
