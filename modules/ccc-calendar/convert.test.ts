import assert from 'node:assert/strict'
import {afterEach, describe, it} from 'node:test'

import moment from 'moment-timezone'

import type {EventType} from '../event-type/index.ts'
import {convertEvents} from './convert.ts'
import type {WireEvent} from './parsers/events.ts'

function wireEvent(over: Partial<WireEvent> = {}): WireEvent {
	return {
		dataSource: 'test',
		startTime: '2026-09-15T18:00:00Z',
		endTime: '2026-09-15T20:00:00Z',
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		title: 'Soccer',
		description: '',
		location: '',
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...over,
	}
}

describe('convertEvents', () => {
	it("keeps a timed event's startTime and endTime as the wire instants", () => {
		let [event] = convertEvents([wireEvent()], {})

		assert.equal(event.startTime.toISOString(), '2026-09-15T18:00:00.000Z')
		assert.equal(event.endTime.toISOString(), '2026-09-15T20:00:00.000Z')
	})

	it("sets an all-day event's startTime to local midnight of the wire instant's UTC date", () => {
		// 02:00Z on the 16th is still the 15th in every zone west of UTC, but the
		// UTC *date* is the 16th -- localMidnightOf must read the date this way,
		// not by asking what local day the instant falls on.
		let [event] = convertEvents(
			[
				wireEvent({
					isAllDay: true,
					startTime: '2026-09-16T02:00:00Z',
					endTime: '2026-09-17T02:00:00Z',
				}),
			],
			{},
		)

		assert.equal(event.startTime.format('YYYY-MM-DDTHH:mm:ss'), '2026-09-16T00:00:00')
	})

	it('gives a zero-length all-day event an endTime one day after startTime', () => {
		// Both instants fall on UTC date 2026-09-16, so they collapse to the same
		// local midnight before the zero-length guard runs.
		let [event] = convertEvents(
			[
				wireEvent({
					isAllDay: true,
					startTime: '2026-09-16T00:00:00Z',
					endTime: '2026-09-16T20:00:00Z',
				}),
			],
			{},
		)

		assert.equal(event.endTime.diff(event.startTime, 'days'), 1)
	})

	it('applies an eventMapper to every event', () => {
		let eventMapper = (event: EventType): EventType => ({...event, title: `${event.title}!`})

		let events = convertEvents([wireEvent({title: 'Soccer'}), wireEvent({title: 'Volleyball'})], {
			eventMapper,
		})

		assert.deepEqual(
			events.map((event) => event.title),
			['Soccer!', 'Volleyball!'],
		)
	})
})

/**
 * The calendar reads every moment in the device's zone, so the conversion has
 * to hold wherever the device is. `moment.tz.setDefault` stands in for moving
 * the device: the simulator cannot be put in another zone.
 */
describe('convertEvents in the device zone', () => {
	afterEach(() => {
		moment.tz.setDefault()
	})

	function allDay(startTime: string, endTime: string): WireEvent {
		return wireEvent({isAllDay: true, startTime, endTime})
	}

	let dayOf = (m: moment.Moment) => m.format('YYYY-MM-DD HH:mm')

	for (let zone of ['America/Chicago', 'Asia/Tokyo']) {
		it(`sits an iCal all-day event at local midnight on its own date in ${zone}`, () => {
			moment.tz.setDefault(zone)

			let [event] = convertEvents([allDay('2030-01-15T00:00:00Z', '2030-01-16T00:00:00Z')], {})

			assert.equal(dayOf(event.startTime), '2030-01-15 00:00')
			assert.equal(dayOf(event.endTime), '2030-01-16 00:00')
		})
	}

	// TEC's real wire shape: campus midnight expressed in UTC, not UTC midnight.
	it('sits a TEC all-day event at local midnight on its own date', () => {
		moment.tz.setDefault('America/Chicago')

		let [event] = convertEvents([allDay('2030-01-15T05:00:00Z', '2030-01-16T04:59:59Z')], {})

		assert.equal(dayOf(event.startTime), '2030-01-15 00:00')
		assert.equal(dayOf(event.endTime), '2030-01-16 00:00')
	})

	it('keeps the instant a timed event names, east of UTC', () => {
		moment.tz.setDefault('Asia/Tokyo')

		let [event] = convertEvents([wireEvent({startTime: '2030-01-15T18:00:00Z'})], {})

		assert.equal(event.startTime.toISOString(), '2030-01-15T18:00:00.000Z')
		assert.equal(dayOf(event.startTime), '2030-01-16 03:00')
	})
})
