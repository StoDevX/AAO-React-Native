import moment from 'moment'
import type {EventType} from '@frogpond/event-type'

import {addToCalendarEvents, calendarSourceId} from '../calendar-events'

const event: EventType = {
	title: 'Founders Day',
	description: 'A celebration',
	location: 'Buntrock',
	startTime: moment('2026-09-01T17:00:00Z'),
	endTime: moment('2026-09-01T19:00:00Z'),
	isAllDay: false,
	isMultiDay: false,
	isSameInstant: false,
	isOngoing: false,
	links: [],
	categories: [],
	config: {startTime: false, endTime: false, subtitle: 'description'},
}

describe('calendarSourceId', () => {
	it.each([
		'stolaf',
		'presence',
		'carleton',
		'ksto-schedule',
		'krlx-schedule',
		'sumo-schedule',
		'upcoming-convos',
	])('keeps %s', (source) => {
		expect(calendarSourceId(source)).toBe(source)
	})

	it('sends anything else as other', () => {
		expect(calendarSourceId('uitest')).toBe('other')
	})
})

describe('addToCalendarEvents', () => {
	it('on a save, counts it and names the event anonymously', () => {
		expect(addToCalendarEvents('saved', 'presence', event)).toStrictEqual([
			{name: 'calendar.add_to_device', attributes: {result: 'saved', source: 'presence'}},
			{
				name: 'calendar.event.added',
				anonymous: true,
				attributes: {source: 'presence', title: 'Founders Day'},
			},
		])
	})

	it.each(['cancelled', 'error'] as const)('on %s, only counts it', (result) => {
		expect(addToCalendarEvents(result, 'stolaf', event)).toStrictEqual([
			{name: 'calendar.add_to_device', attributes: {result, source: 'stolaf'}},
		])
	})
})
