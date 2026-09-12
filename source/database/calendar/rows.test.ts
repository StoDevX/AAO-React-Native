import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import type {WireEvent} from '../../../modules/ccc-calendar/parsers/events.ts'
import {toRows} from './rows.ts'

function wireEvent(over: Partial<WireEvent> = {}): WireEvent {
	return {
		dataSource: 'test',
		startTime: '2026-09-15T18:00:00Z',
		endTime: '2026-09-15T20:00:00Z',
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		title: 'Soccer',
		description: 'A game',
		location: 'Field',
		isOngoing: false,
		links: [],
		categories: ['Sports'],
		organization: ['Athletics'],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...over,
	}
}

describe('toRows', () => {
	it('writes one occurrence per event, filtering on instants when timed', () => {
		let {events, occurrences} = toRows('stolaf', 0, [wireEvent()])
		assert.equal(events.length, 1)
		assert.equal(occurrences.length, 1)
		assert.equal(occurrences[0].allDay, false)
		assert.equal(occurrences[0].startUtc, Date.parse('2026-09-15T18:00:00Z'))
		assert.equal(occurrences[0].startDate, null, 'a timed event carries no dates')
	})

	// Real TEC wire values, copied from the live feed on 2026-09-11. The event
	// runs 2026-09-11 to 2026-12-06 in campus time; TEC emits campus midnight
	// expressed in UTC, so the end instant's UTC DATE is already 2026-12-07 --
	// the exclusive end. Nothing is added.
	it('stores a TEC all-day event as dates, with an exclusive end', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-09-11T05:00:00Z',
				endTime: '2026-12-07T05:59:59Z',
			}),
		])
		assert.equal(occurrences[0].allDay, true)
		assert.equal(occurrences[0].startDate, '2026-09-11')
		assert.equal(occurrences[0].endDate, '2026-12-07', 'end_date is exclusive')
	})

	// A single-day TEC all-day event, same encoding: 2026-09-12 local becomes
	// 05:00Z that day to 04:59:59Z the next, so the UTC dates are already
	// start=2026-09-12, exclusive end=2026-09-13.
	it('stores a single-day TEC all-day event without stretching it', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-09-12T05:00:00Z',
				endTime: '2026-09-13T04:59:59Z',
			}),
		])
		assert.equal(occurrences[0].startDate, '2026-09-12')
		assert.equal(occurrences[0].endDate, '2026-09-13')
	})

	// iCal emits DATE-valued DTSTART/DTEND at UTC midnight, and RFC 5545 already
	// defines a DATE-valued DTEND as exclusive. So it agrees with TEC: read the
	// UTC date, add nothing.
	it('stores an iCal all-day event without stretching it', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-09-11T00:00:00Z',
				endTime: '2026-12-07T00:00:00Z',
			}),
		])
		assert.equal(occurrences[0].startDate, '2026-09-11')
		assert.equal(occurrences[0].endDate, '2026-12-07')
	})

	it('gives a zero-length all-day event a whole day', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-09-11T00:00:00Z',
				endTime: '2026-09-11T00:00:00Z',
			}),
		])
		assert.equal(occurrences[0].startDate, '2026-09-11')
		assert.equal(occurrences[0].endDate, '2026-09-12')
	})

	it('emits a tag row per value on each axis', () => {
		let {tags} = toRows('stolaf', 0, [
			wireEvent({categories: ['Sports', 'Athletics'], organization: ['Athletics Dept']}),
		])
		assert.deepEqual(
			tags.map((t) => `${t.axis}:${t.value}`).sort(),
			['category:Athletics', 'category:Sports', 'organization:Athletics Dept'].sort(),
		)
	})

	it('emits no organization rows when the source names no sponsor', () => {
		let {tags} = toRows('stolaf', 0, [wireEvent({organization: undefined})])
		assert.equal(tags.filter((t) => t.axis === 'organization').length, 0)
	})

	it('round-trips the wire event through the stored JSON', () => {
		let input = wireEvent()
		let {events} = toRows('stolaf', 0, [input])
		assert.deepEqual(JSON.parse(events[0].wire), input)
	})

	it('carries the source rank onto every event row', () => {
		let {events} = toRows('presence', 1, [wireEvent()])
		assert.equal(events[0].sourceRank, 1)
	})
})
