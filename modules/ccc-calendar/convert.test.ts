import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

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
