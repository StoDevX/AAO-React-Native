import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {
	parseReminderIdentifier,
	planReminderChanges,
	unreadableReminders,
	reminderBody,
	reminderIdentifier,
	reminderSlot,
	type PendingReminder,
	type StationFeed,
} from '../plan'

const CHICAGO = 'America/Chicago'
const CAFECITO = {stationId: 'ksto', title: 'Cafecito Hour'} as const

/** A show starting at `start`, a wall-clock time in Chicago, an hour long. */
function show(title: string, start: string): EventType {
	let startTime = moment.tz(start, CHICAGO)
	return {
		title,
		description: '',
		location: '',
		startTime,
		endTime: startTime.clone().add(1, 'hour'),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
	}
}

function kstoFeed(events: EventType[]): StationFeed {
	return {stationId: 'ksto', stationName: 'KSTO 93.1 FM', events}
}

function pending(
	stationId: PendingReminder['stationId'],
	title: string,
	slot: PendingReminder['slot'],
): PendingReminder {
	return {identifier: reminderIdentifier(stationId, title, slot), stationId, title, slot}
}

function plan(input: {
	follows?: Array<{stationId: PendingReminder['stationId']; title: string}>
	feeds?: StationFeed[]
	pending?: PendingReminder[]
	granted?: boolean
	zone?: string
}) {
	return planReminderChanges({
		follows: input.follows ?? [CAFECITO],
		feeds: input.feeds ?? [],
		pending: input.pending ?? [],
		granted: input.granted ?? true,
		zone: input.zone ?? CHICAGO,
	})
}

/** The weekday (1 is Sunday), hour and minute of each request. */
function slots(requests: ReadonlyArray<{slot: PendingReminder['slot']}>) {
	return requests.map(({slot}) => [slot.weekday, slot.hour, slot.minute])
}

describe('reminderSlot', () => {
	test('is a minute before the show, in the zone given', () => {
		let start = moment.tz('2026-10-27T21:00', CHICAGO)
		expect(reminderSlot(start.toDate(), CHICAGO)).toStrictEqual({weekday: 3, hour: 20, minute: 59})
	})

	test('follows the device into another zone', () => {
		let start = moment.tz('2026-10-27T21:00', CHICAGO)
		expect(reminderSlot(start.toDate(), 'America/New_York')).toStrictEqual({
			weekday: 3,
			hour: 21,
			minute: 59,
		})
	})

	test('falls on the day before for a show starting at midnight', () => {
		let start = moment.tz('2026-10-27T00:00', CHICAGO)
		expect(reminderSlot(start.toDate(), CHICAGO)).toStrictEqual({weekday: 2, hour: 23, minute: 59})
	})
})

describe('reminder identifiers', () => {
	test('name the show and slot they were made from', () => {
		let slot = {weekday: 3, hour: 20, minute: 59}
		let identifier = reminderIdentifier('krlx', 'Pipes | Drums', slot)
		expect(parseReminderIdentifier(identifier)).toStrictEqual({
			identifier,
			stationId: 'krlx',
			title: 'Pipes | Drums',
			slot,
		})
	})

	test('leave notifications that are not reminders alone', () => {
		expect(parseReminderIdentifier('something-else')).toBeNull()
	})

	test('do not read a reminder naming an unknown station', () => {
		expect(parseReminderIdentifier('radio-reminder|wxyz|3|20|59|Show')).toBeNull()
	})
})

test('unreadableReminders picks out reminders no sync can read, leaving other notifications', () => {
	let readable = reminderIdentifier('ksto', 'Cafecito Hour', {weekday: 3, hour: 20, minute: 59})
	expect(
		unreadableReminders([
			readable,
			'radio-reminder|wxyz|3|20|59|Show',
			'radio-reminder|ksto|x|20|59|Show',
			'something-else',
		]),
	).toStrictEqual(['radio-reminder|wxyz|3|20|59|Show', 'radio-reminder|ksto|x|20|59|Show'])
})

test('reminderBody says the show is about to start, leaving the station to the title', () => {
	expect(reminderBody('Cafecito Hour')).toBe('Cafecito Hour is about to start.')
})

describe('planReminderChanges', () => {
	test('schedules each weekly airing of a followed show', () => {
		let feed = kstoFeed([
			show('Cafecito Hour', '2026-10-26T21:00'),
			show('Other', '2026-10-27T10:00'),
			show('Cafecito Hour', '2026-10-29T21:00'),
		])
		let changes = plan({feeds: [feed]})
		expect(slots(changes.schedule)).toStrictEqual([
			[2, 20, 59],
			[5, 20, 59],
		])
		expect(changes.schedule[0]).toMatchObject({
			stationId: 'ksto',
			title: 'Cafecito Hour',
			stationName: 'KSTO 93.1 FM',
			body: 'Cafecito Hour is about to start.',
		})
		expect(changes.cancel).toStrictEqual([])
	})

	test('finds a followed show whose title the feed has restyled, saying it as the feed does', () => {
		let changes = plan({
			follows: [{stationId: 'ksto', title: 'HOZ'}],
			feeds: [kstoFeed([show('hoz!', '2026-10-26T21:00')])],
		})
		expect(changes.schedule).toHaveLength(1)
		expect(changes.schedule[0]).toMatchObject({title: 'HOZ', body: 'hoz! is about to start.'})
	})

	test('keeps a restyled show’s pending reminder', () => {
		let slot = {weekday: 2, hour: 20, minute: 59}
		let changes = plan({
			follows: [{stationId: 'ksto', title: 'hoz'}],
			feeds: [kstoFeed([show('HOZ', '2026-10-26T21:00')])],
			pending: [pending('ksto', 'HOZ', slot)],
		})
		expect(changes.cancel).toStrictEqual([])
		expect(changes.schedule).toStrictEqual([])
	})

	test('schedules a slot once when the feed holds two weeks of it', () => {
		let feed = kstoFeed([
			show('Cafecito Hour', '2026-10-26T21:00'),
			show('Cafecito Hour', '2026-11-02T21:00'),
		])
		expect(slots(plan({feeds: [feed]}).schedule)).toStrictEqual([[2, 20, 59]])
	})

	// Chicago's clocks go back on November 1, 2026, and UTC's never do, so a
	// phone on UTC sees Monday's 9pm show an hour later from then on.
	test('schedules a show once when its hour moves on the phone partway through the feed', () => {
		let feed = kstoFeed([
			show('Cafecito Hour', '2026-10-26T21:00'),
			show('Cafecito Hour', '2026-11-02T21:00'),
		])
		expect(slots(plan({feeds: [feed], zone: 'UTC'}).schedule)).toStrictEqual([[3, 1, 59]])
	})

	test('moves a show to its new hour on the phone once the airing before the change has passed', () => {
		let feed = kstoFeed([
			show('Cafecito Hour', '2026-11-02T21:00'),
			show('Cafecito Hour', '2026-11-09T21:00'),
		])
		let before = pending('ksto', 'Cafecito Hour', {weekday: 3, hour: 1, minute: 59})
		let changes = plan({feeds: [feed], pending: [before], zone: 'UTC'})
		expect(changes.cancel).toStrictEqual([before.identifier])
		expect(slots(changes.schedule)).toStrictEqual([[3, 2, 59]])
	})

	test('keeps the reminder of a show off the air for the feed’s first week', () => {
		let feed = kstoFeed([
			show('Other', '2026-10-26T10:00'),
			show('Other', '2026-11-03T10:00'),
			show('Cafecito Hour', '2026-11-04T21:00'),
		])
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 4, hour: 20, minute: 59})
		expect(plan({feeds: [feed], pending: [existing]})).toStrictEqual({schedule: [], cancel: []})
	})

	test('schedules nothing without permission', () => {
		let feed = kstoFeed([show('Cafecito Hour', '2026-10-26T21:00')])
		expect(plan({feeds: [feed], granted: false}).schedule).toStrictEqual([])
	})

	test('schedules follows saved before permission was granted', () => {
		let feed = kstoFeed([show('Cafecito Hour', '2026-10-26T21:00')])
		expect(slots(plan({feeds: [feed], pending: []}).schedule)).toStrictEqual([[2, 20, 59]])
	})

	test('does not schedule a slot already pending', () => {
		let feed = kstoFeed([show('Cafecito Hour', '2026-10-26T21:00')])
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 2, hour: 20, minute: 59})
		expect(plan({feeds: [feed], pending: [existing]})).toStrictEqual({schedule: [], cancel: []})
	})

	test("cancels an unfollowed show's reminders, without permission or a feed", () => {
		let existing = pending('krlx', 'Static', {weekday: 6, hour: 8, minute: 59})
		expect(plan({pending: [existing], granted: false}).cancel).toStrictEqual([existing.identifier])
	})

	test('cancels a slot inside the feed when the show is gone from it', () => {
		let feed = kstoFeed([show('Other', '2026-10-26T10:00'), show('Other', '2026-11-03T10:00')])
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 4, hour: 20, minute: 59})
		expect(plan({feeds: [feed], pending: [existing]}).cancel).toStrictEqual([existing.identifier])
	})

	test('moves a show whose time changed inside the feed', () => {
		let feed = kstoFeed([
			show('Other', '2026-10-26T10:00'),
			show('Cafecito Hour', '2026-10-27T21:30'),
			show('Other', '2026-10-29T10:00'),
		])
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 3, hour: 20, minute: 59})
		let changes = plan({feeds: [feed], pending: [existing]})
		expect(changes.cancel).toStrictEqual([existing.identifier])
		expect(slots(changes.schedule)).toStrictEqual([[3, 21, 29]])
	})

	test('keeps a slot beyond the end of a short feed', () => {
		let feed = kstoFeed([show('Other', '2026-10-26T10:00'), show('Other', '2026-10-28T10:00')])
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 6, hour: 20, minute: 59})
		expect(plan({feeds: [feed], pending: [existing]})).toStrictEqual({schedule: [], cancel: []})
	})

	test('leaves a station without a feed alone', () => {
		let existing = pending('ksto', 'Cafecito Hour', {weekday: 4, hour: 20, minute: 59})
		let krlx: StationFeed = {stationId: 'krlx', stationName: 'KRLX', events: []}
		expect(plan({feeds: [krlx], pending: [existing]})).toStrictEqual({schedule: [], cancel: []})
	})
})
