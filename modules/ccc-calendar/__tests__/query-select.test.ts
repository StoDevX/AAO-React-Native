import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment'

import type {WireEvent} from '../parsers/events'
import {deviceCalendarOptions, namedCalendarOptions} from '../query'
import {EventType} from '@frogpond/event-type'

// `query.ts` reaches EventKit for the device queries, and the shared query
// client it imports subscribes to network reachability at module load. Neither
// runs here: every test below calls a `select` by hand, which is pure.
jest.mock('expo-calendar', () => ({EntityTypes: {EVENT: 'event'}}))
jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

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
		startTime: '2026-08-17T07:45:00Z',
		endTime: '2026-08-17T11:30:00Z',
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
			`${moment('2026-08-17T07:45:00Z').toISOString()}|New Faculty Orientation`,
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
			moment('2026-08-17T07:45:00Z').toISOString(),
		)
	})

	test('an eventMapper runs before the event is tagged', () => {
		let selected = selectNamed('stolaf', {
			eventMapper: (event) => ({...event, title: `${event.title}!`}),
		})([makeWireEvent()])

		expect(selected[0]?.event.title).toBe('New Faculty Orientation!')
		expect(selected[0]?.key).toBe(
			`${moment('2026-08-17T07:45:00Z').toISOString()}|New Faculty Orientation!`,
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
				startTime: moment('2026-09-07T00:00:00'),
				endTime: moment('2026-09-07T23:59:59'),
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
