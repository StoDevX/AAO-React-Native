import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {currentAndUpcomingShows} from '../current-shows'

const ZONE = 'America/Chicago'
const at = (iso: string) => moment.tz(iso, ZONE)

function show(title: string, start: string, end: string): EventType {
	return {
		title,
		description: '',
		location: '',
		startTime: at(start),
		endTime: at(end),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'description'},
	}
}

const MORNING = show('Morning Drive', '2026-10-02T08:00', '2026-10-02T10:00')
const LUNCH = show('Lunch Beats', '2026-10-02T12:00', '2026-10-02T13:00')
const AFTER = show('Afternoon Tea', '2026-10-02T13:00', '2026-10-02T14:00')
const LATE = show('Late Night', '2026-10-02T23:00', '2026-10-03T01:00')
const TOMORROW = show('Tomorrow Show', '2026-10-03T09:00', '2026-10-03T10:00')

describe('currentAndUpcomingShows', () => {
	test('finds the show running now and the rest of today, in order', () => {
		let result = currentAndUpcomingShows(
			[TOMORROW, LATE, AFTER, LUNCH, MORNING],
			at('2026-10-02T09:15'),
		)
		expect(result.current?.title).toBe('Morning Drive')
		expect(result.upcoming.map((e) => e.title)).toStrictEqual([
			'Lunch Beats',
			'Afternoon Tea',
			'Late Night',
		])
	})

	test('is off air between shows', () => {
		let result = currentAndUpcomingShows([MORNING, LUNCH], at('2026-10-02T11:00'))
		expect(result.current).toBeNull()
		expect(result.upcoming.map((e) => e.title)).toStrictEqual(['Lunch Beats'])
	})

	test('hands over to the next show at the minute it starts', () => {
		let result = currentAndUpcomingShows([LUNCH, AFTER], at('2026-10-02T13:00'))
		expect(result.current?.title).toBe('Afternoon Tea')
		expect(result.upcoming).toStrictEqual([])
	})

	test('a show that ended a minute ago is neither current nor upcoming', () => {
		let result = currentAndUpcomingShows([MORNING], at('2026-10-02T10:01'))
		expect(result).toStrictEqual({current: null, upcoming: []})
	})

	test('a show running across midnight is current, and today is the new day', () => {
		let result = currentAndUpcomingShows([LATE, TOMORROW], at('2026-10-03T00:30'))
		expect(result.current?.title).toBe('Late Night')
		expect(result.upcoming.map((e) => e.title)).toStrictEqual(['Tomorrow Show'])
	})

	test('an empty schedule has nothing on', () => {
		expect(currentAndUpcomingShows([], at('2026-10-02T09:00'))).toStrictEqual({
			current: null,
			upcoming: [],
		})
	})
})
