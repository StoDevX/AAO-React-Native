import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'

import type {WireEvent} from '../parsers/events'
import {
	deviceCalendarOptions,
	namedCalendarOptions,
	scheduleCalendarOptions,
	sourceRankOf,
} from '../query'
import {REMOTE_SOURCES} from '../sources'
import uitestFixtures from '../fixtures/uitest-events.json'
import {EventType} from '@frogpond/event-type'
import {groupEvents} from '@frogpond/event-list/sections'
import {now} from '@frogpond/timer'
import {getRunner} from '../../../source/database/client'
import {bumpCalendarRevision} from '../../../source/database/calendar/revision'
import {writeSource} from '../../../source/database/calendar/write'
import * as Sentry from '@sentry/react-native'

// `query.ts` reaches EventKit for the device queries, and the shared query
// client it imports subscribes to network reachability at module load. Neither
// runs here: every test below calls a `select` (or, for the ingest query, a
// `queryFn`) by hand, against fixture data rather than the network.
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

// `namedCalendarOptions`'s `queryFn` writes into the database rather than
// returning events, so the ingest tests below assert against the write
// itself rather than against a real SQLite file.
jest.mock('../../../source/database/client', () => ({getRunner: jest.fn(() => 'the-runner')}))
jest.mock('../../../source/database/calendar/revision', () => ({bumpCalendarRevision: jest.fn()}))
jest.mock('../../../source/database/calendar/write', () => ({
	writeSource: jest.fn(),
	retentionFor: jest.fn(() => 'the-retention'),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

// `queryOptions` types `select`/`queryFn` as optional, so these name the
// assertion once rather than at every call below.
function selectSchedule(calendar: string, options?: Parameters<typeof scheduleCalendarOptions>[1]) {
	let {select} = scheduleCalendarOptions(calendar, options)
	if (!select) throw new Error('scheduleCalendarOptions should tag its results')
	return select
}

function selectDevice(calendarId: string) {
	let {select} = deviceCalendarOptions(calendarId)
	if (!select) throw new Error('deviceCalendarOptions should tag its results')
	return select
}

function ingestFor(calendar: string) {
	let {queryFn} = namedCalendarOptions(calendar)
	if (typeof queryFn !== 'function') {
		throw new Error(`namedCalendarOptions('${calendar}') built no queryFn`)
	}
	return () => queryFn({queryKey: ['calendar', 'named', calendar], signal: undefined} as never)
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

describe('sourceRankOf', () => {
	// `scripts/jest-setup.js` mocks `@frogpond/launch-arguments` to
	// `isUITesting: true` for every test in this repo, so `REMOTE_SOURCES` here
	// is always the single-entry UI-test fixture list, never `[stolaf,
	// presence]` -- reading the id straight off it, rather than hardcoding
	// `'stolaf'`, keeps this test honest about which list it is checking.
	let [firstSource] = REMOTE_SOURCES
	if (!firstSource) throw new Error('REMOTE_SOURCES must not be empty')

	test('ranks a source by its position in REMOTE_SOURCES', () => {
		expect(sourceRankOf(firstSource.id)).toBe(0)
	})

	test('an id REMOTE_SOURCES does not list ranks past the end, never 0 ahead of the first', () => {
		expect(sourceRankOf('northfield')).toBe(REMOTE_SOURCES.length)
		expect(sourceRankOf('northfield')).toBeGreaterThan(sourceRankOf(firstSource.id))
	})
})

/**
 * `namedCalendarOptions` writes the fetched wire straight into the database
 * and resolves to a receipt of that write, not the events themselves.
 * `'uitest'` is used throughout so these run against the bundled fixture
 * rather than the network, the same way the rest of this file avoids it.
 */
describe('namedCalendarOptions', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	test('writes the fetched wire events into the database, ranked and retained', async () => {
		await ingestFor('uitest')()

		expect(writeSource).toHaveBeenCalledWith(
			getRunner(),
			'uitest',
			sourceRankOf('uitest'),
			uitestFixtures,
			'the-retention',
		)
	})

	test('bumps the calendar revision after a successful write', async () => {
		await ingestFor('uitest')()

		expect(bumpCalendarRevision).toHaveBeenCalledTimes(1)
	})

	test('resolves to a receipt describing the write, not the events', async () => {
		let receipt = await ingestFor('uitest')()

		expect(receipt).toEqual({writtenAt: expect.any(Number), count: uitestFixtures.length})
	})

	// The one failure here that would otherwise be invisible: the revision
	// never bumps, so the screen keeps showing the previous window and the
	// user sees nothing wrong. Reported to Sentry, and rethrown so React
	// Query marks the source failed and the picker names it.
	test('reports a write failure to Sentry and still rejects', async () => {
		let error = new Error('disk full')
		jest.mocked(writeSource).mockImplementationOnce(() => {
			throw error
		})

		await expect(ingestFor('uitest')()).rejects.toThrow(error)

		expect(Sentry.captureException).toHaveBeenCalledWith(error)
		expect(bumpCalendarRevision).not.toHaveBeenCalled()
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
 * `scheduleCalendarOptions` is KSTO's and KRLX's broadcast schedules' own
 * fetch-convert-and-tag query, kept for them because their events are never
 * written into the database the way a campus calendar's are.
 */
describe('scheduleCalendarOptions select', () => {
	test('every event is tagged with the calendar it was fetched from', () => {
		let events = [makeWireEvent({title: 'One'}), makeWireEvent({title: 'Two'})]

		let selected = selectSchedule('krlx-schedule')(events)

		expect(selected.map((entry) => entry.sourceId)).toEqual(['krlx-schedule', 'krlx-schedule'])
	})

	test('two schedules tag the same event differently', () => {
		let event = makeWireEvent()

		let [krlx] = selectSchedule('krlx-schedule')([event])
		let [ksto] = selectSchedule('ksto-schedule')([event])

		expect(krlx?.sourceId).toBe('krlx-schedule')
		expect(ksto?.sourceId).toBe('ksto-schedule')
	})

	test('the key is the start time and title the detail screen looks up by', () => {
		let event = makeWireEvent()

		let [selected] = selectSchedule('krlx-schedule')([event])

		expect(selected?.key).toBe(
			`${moment('2026-09-10T07:45:00Z').toISOString()}|New Faculty Orientation`,
		)
	})

	test('two events on one schedule get keys of their own', () => {
		let events = [makeWireEvent({title: 'One'}), makeWireEvent({title: 'Two'})]

		let selected = selectSchedule('krlx-schedule')(events)

		expect(selected[0]?.key).not.toBe(selected[1]?.key)
	})

	test('the wire’s string times come back as moments', () => {
		let [selected] = selectSchedule('krlx-schedule')([makeWireEvent()])

		expect(moment.isMoment(selected?.event.startTime)).toBe(true)
		expect(selected?.event.startTime.toISOString()).toBe(
			moment('2026-09-10T07:45:00Z').toISOString(),
		)
	})

	test('an eventMapper runs before the event is tagged', () => {
		let selected = selectSchedule('krlx-schedule', {
			eventMapper: (event) => ({...event, title: `${event.title}!`}),
		})([makeWireEvent()])

		expect(selected[0]?.event.title).toBe('New Faculty Orientation!')
		expect(selected[0]?.key).toBe(
			`${moment('2026-09-10T07:45:00Z').toISOString()}|New Faculty Orientation!`,
		)
	})
})

/**
 * An all-day event is a calendar date, not an instant. The wire instant's UTC
 * date has to be that calendar date -- iCal satisfies this by emitting UTC
 * midnight, TEC by emitting campus midnight expressed in UTC. Read back in
 * the device's zone that lands a day early west of UTC and at the wrong time
 * east of it, so the boundary re-anchors it to local midnight on its own
 * date.
 *
 * Run against `scheduleCalendarOptions` because that is the query still
 * carrying `convertEvents` through a `select` -- the conversion itself is
 * `convertEvents`' own behaviour, exercised here through the one caller left
 * that still runs it this way.
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

		let [selected] = selectSchedule('krlx-schedule')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('sits at local midnight on its own date, east of UTC', () => {
		moment.tz.setDefault('Asia/Tokyo')

		let [selected] = selectSchedule('krlx-schedule')([allDayEvent()])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	test('a timed event keeps the instant it names', () => {
		moment.tz.setDefault('Asia/Tokyo')
		let event = makeWireEvent({
			startTime: '2030-01-15T18:00:00.000Z',
			endTime: '2030-01-15T20:00:00.000Z',
		})

		let [selected] = selectSchedule('krlx-schedule')([event])

		expect(selected?.event.startTime.toISOString()).toBe('2030-01-15T18:00:00.000Z')
	})

	test('reaches the list under its own day, not the day before', () => {
		moment.tz.setDefault('America/Chicago')
		let selected = selectSchedule('krlx-schedule')([allDayEvent()])

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

		let selected = selectSchedule('krlx-schedule')([event])
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

		let [selected] = selectSchedule('krlx-schedule')([event])

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

		let [selected] = selectSchedule('krlx-schedule')([event])

		expect(selected?.event.startTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-15 00:00')
		expect(selected?.event.endTime.format('YYYY-MM-DD HH:mm')).toBe('2030-01-16 00:00')
	})

	// Without the collapse guard, the re-anchored span is zero-length, and
	// `scheduleCalendarOptions`'s own "has it ended?" filter drops it -- the
	// event vanishes from the schedule all day, in every zone, rather than
	// merely rendering the wrong span.
	test('a collapsed all-day event still shows up in the list instead of vanishing as already over', () => {
		moment.tz.setDefault('America/Chicago')
		jest.mocked(now).mockReturnValueOnce(moment('2030-01-15T12:00:00.000Z'))

		let event = makeWireEvent({
			startTime: '2030-01-15T00:00:00.000Z',
			endTime: '2030-01-15T23:59:59.000Z',
			isAllDay: true,
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		let selected = selectSchedule('krlx-schedule')([event])

		expect(selected).toHaveLength(1)
	})
})
