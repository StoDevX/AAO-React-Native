import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'

import type {WireEvent} from '../parsers/events'
import {deviceCalendarOptions, namedCalendarOptions} from '../query'
import {EventType} from '@frogpond/event-type'
import {groupEvents} from '@frogpond/event-list/sections'
import {now} from '@frogpond/timer'

// `query.ts` reaches EventKit for the device queries, and the shared query
// client it imports subscribes to network reachability at module load. Neither
// runs here: every test below calls a `select` by hand, which is pure.
jest.mock('expo-calendar', () => ({EntityTypes: {EVENT: 'event'}}))
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
// Wraps the real clock so a single test can stand `now` on a fixed date --
// every other test falls through to the real implementation untouched.
jest.mock('@frogpond/timer', () => {
	let actual = jest.requireActual('@frogpond/timer') as object
	return {...actual, now: jest.fn((actual as {now: () => unknown}).now)}
})

// `queryOptions` types `select` as optional, so these name the assertion once
// rather than at every call below.
function selectNamed(calendar: string, options?: Parameters<typeof namedCalendarOptions>[1]) {
	let {select} = namedCalendarOptions(calendar, options)
	if (!select) throw new Error('namedCalendarOptions should tag its results')
	return select
}

function selectDevice(calendarId: string) {
	let {select} = deviceCalendarOptions(calendarId)
	if (!select) throw new Error('deviceCalendarOptions should tag its results')
	return select
}

function makeWireEvent(overrides: Partial<WireEvent> = {}): WireEvent {
	return {
		dataSource: 'tribe',
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: '2026-09-10T07:45:00Z',
		endTime: '2026-09-10T11:30:00Z',
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

/**
 * Where an event's `sourceId` and `key` are actually assigned. A wrong
 * `sourceId` puts an event under another calendar's name and tint; a wrong
 * `key` sends the detail screen looking up an event that isn't there.
 */
describe('namedCalendarOptions select', () => {
	test('every event is tagged with the calendar it was fetched from', () => {
		let events = [makeWireEvent({title: 'One'}), makeWireEvent({title: 'Two'})]

		let selected = selectNamed('northfield')(events)

		expect(selected.map((entry) => entry.sourceId)).toEqual(['northfield', 'northfield'])
	})

	test('two calendars tag the same event differently', () => {
		let event = makeWireEvent()

		let [olaf] = selectNamed('stolaf')([event])
		let [northfield] = selectNamed('northfield')([event])

		expect(olaf?.sourceId).toBe('stolaf')
		expect(northfield?.sourceId).toBe('northfield')
	})

	test('the key is the start time and title the detail screen looks up by', () => {
		let event = makeWireEvent()

		let [selected] = selectNamed('stolaf')([event])

		expect(selected?.key).toBe(
			`${moment('2026-09-10T07:45:00Z').toISOString()}|New Faculty Orientation`,
		)
	})

	test('two events on one calendar get keys of their own', () => {
		let events = [makeWireEvent({title: 'One'}), makeWireEvent({title: 'Two'})]

		let selected = selectNamed('stolaf')(events)

		expect(selected[0]?.key).not.toBe(selected[1]?.key)
	})

	test('the wire’s string times come back as moments', () => {
		let [selected] = selectNamed('stolaf')([makeWireEvent()])

		expect(moment.isMoment(selected?.event.startTime)).toBe(true)
		expect(selected?.event.startTime.toISOString()).toBe(
			moment('2026-09-10T07:45:00Z').toISOString(),
		)
	})

	test('an eventMapper runs before the event is tagged', () => {
		let selected = selectNamed('stolaf', {
			eventMapper: (event) => ({...event, title: `${event.title}!`}),
		})([makeWireEvent()])

		expect(selected[0]?.event.title).toBe('New Faculty Orientation!')
		expect(selected[0]?.key).toBe(
			`${moment('2026-09-10T07:45:00Z').toISOString()}|New Faculty Orientation!`,
		)
	})
})

describe('deviceCalendarOptions select', () => {
	function makeDeviceEvent(
		id: string,
		calendarId: string,
	): {calendarId: string; id: string; event: EventType} {
		return {
			calendarId,
			id,
			event: {
				title: 'Labor Day',
				description: '',
				location: '',
				startTime: moment('2026-09-10T00:00:00'),
				endTime: moment('2026-09-10T23:59:59'),
				isAllDay: false,
				isMultiDay: false,
				isSameInstant: false,
				isOngoing: false,
				links: [],
				categories: [],
				config: {startTime: false, endTime: false, subtitle: 'location' as const},
			},
		}
	}

	test('every event is tagged with the device calendar it was fetched from', () => {
		let events = [makeDeviceEvent('evt-1', 'cal-1'), makeDeviceEvent('evt-2', 'cal-1')]

		let selected = selectDevice('cal-1')(events)

		expect(selected.map((entry) => entry.sourceId)).toEqual(['device:cal-1', 'device:cal-1'])
	})

	test('two device calendars tag the same event differently', () => {
		let event = makeDeviceEvent('evt-1', 'cal-1')

		let [first] = selectDevice('cal-1')([event])
		let [second] = selectDevice('cal-2')([event])

		expect(first?.sourceId).toBe('device:cal-1')
		expect(second?.sourceId).toBe('device:cal-2')
	})

	// EventKit's own event id, not the `startTime|title` key a remote event
	// gets -- it is what the detail screen reads the event back by.
	test('the key is EventKit’s event id', () => {
		let selected = selectDevice('cal-1')([makeDeviceEvent('evt-1', 'cal-1')])

		expect(selected[0]?.key).toBe('evt-1')
	})
})

/**
 * An all-day event is a calendar date, not an instant. The wire instant's UTC
 * date has to be that calendar date -- iCal satisfies this by emitting UTC
 * midnight, TEC by emitting campus midnight expressed in UTC. Read back in
 * the device's zone that lands a day early west of UTC and at the wrong time
 * east of it, so the boundary re-anchors it to local midnight on its own
 * date.
 */
describe('all-day events', () => {
	afterEach(() => {
		moment.tz.setDefault()
	})

	function allDayEvent() {
		return makeWireEvent({
			startTime: '2030-01-15T00:00:00.000Z',
			endTime: '2030-01-16T00:00:00.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})
	}

	test('sits at local midnight on its own date, west of UTC', () => {
		moment.tz.setDefault('America/Chicago')

		let [selected] = selectNamed('stolaf')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('sits at local midnight on its own date, east of UTC', () => {
		moment.tz.setDefault('Asia/Tokyo')

		let [selected] = selectNamed('stolaf')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('a timed event keeps the instant it names', () => {
		moment.tz.setDefault('Asia/Tokyo')
		let event = makeWireEvent({
			startTime: '2030-01-15T18:00:00.000Z',
			endTime: '2030-01-15T20:00:00.000Z',
		})

		let [selected] = selectNamed('stolaf')([event])

		expect(selected?.event.startTime.toISOString()).toBe('2030-01-15T18:00:00.000Z')
	})

	test('reaches the list under its own day, not the day before', () => {
		moment.tz.setDefault('America/Chicago')
		let selected = selectNamed('stolaf')([allDayEvent()])

		let sections = groupEvents(selected, moment('2030-01-10T12:00:00Z'))

		expect(sections.map((section) => section.key)).toEqual(['2030-01-15'])
	})

	// The calendar reads `now` from the device too, so a day boundary has to
	// hold when the device is far enough east to be on tomorrow already. This
	// belongs here rather than in an XCUITest because `app.launchEnvironment["TZ"]`
	// does not move Hermes' clock on the simulator, so the simulator cannot be
	// put in another zone -- the zone matrix has to live in Jest instead.
	test('an event groups under the device day, not campus day', () => {
		moment.tz.setDefault('Asia/Tokyo')
		let event = makeWireEvent({
			startTime: '2030-01-15T17:00:00.000Z',
			endTime: '2030-01-15T18:00:00.000Z',
		})

		let selected = selectNamed('stolaf')([event])
		let sections = groupEvents(selected, moment('2030-01-10T12:00:00Z'))

		// 17:00Z is 02:00 on the 16th in Tokyo.
		expect(sections.map((section) => section.key)).toEqual(['2030-01-16'])
	})

	// TEC's real wire shape: campus midnight expressed in UTC, not UTC midnight.
	// The start and end fall on different UTC dates here, so each anchors to
	// its own local midnight without help from the collapse guard below.
	test('lands on its own date for TEC’s real wire shape', () => {
		moment.tz.setDefault('America/Chicago')
		let event = makeWireEvent({
			startTime: '2030-01-15T05:00:00.000Z',
			endTime: '2030-01-16T04:59:59.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		let [selected] = selectNamed('stolaf')([event])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	// An all-day event whose wire start and end share a UTC date collapses to
	// local midnight on both ends, which reads as already over everywhere. It
	// must still cover its day.
	test('still spans a full day when start and end share a UTC date', () => {
		moment.tz.setDefault('America/Chicago')
		let event = makeWireEvent({
			startTime: '2030-01-15T00:00:00.000Z',
			endTime: '2030-01-15T23:59:59.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		let [selected] = selectNamed('stolaf')([event])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	// Without the collapse guard, the re-anchored span is zero-length, and
	// `namedCalendarOptions`'s own "has it ended?" filter drops it -- the event
	// vanishes from the list all day, in every zone, rather than merely
	// rendering the wrong span.
	test('a collapsed all-day event still shows up in the list instead of vanishing as already over', () => {
		moment.tz.setDefault('America/Chicago')
		jest.mocked(now).mockReturnValueOnce(moment('2030-01-15T12:00:00.000Z'))

		let event = makeWireEvent({
			startTime: '2030-01-15T00:00:00.000Z',
			endTime: '2030-01-15T23:59:59.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		let selected = selectNamed('stolaf')([event])

		expect(selected).toHaveLength(1)
	})
})
