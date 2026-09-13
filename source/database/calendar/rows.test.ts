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

	// America/Chicago springs forward on 2026-03-08, so a local +1 day is only
	// 23 real hours -- long enough to fall short of the next UTC date. The
	// zero-length guard has to advance the calendar date in UTC, not by
	// stepping local wall-clock days, or it silently no-ops on this one day a
	// year (under this suite's TZ=America/Chicago).
	it('gives a zero-length all-day event a whole day across a DST spring-forward', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-03-08T00:00:00Z',
				endTime: '2026-03-08T00:00:00Z',
			}),
		])
		assert.equal(occurrences[0].startDate, '2026-03-08')
		assert.equal(occurrences[0].endDate, '2026-03-09')
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

	it('normalizes an empty wire location to null', () => {
		let {events} = toRows('stolaf', 0, [wireEvent({location: ''})])
		assert.equal(events[0].location, null)
	})

	it('passes a real wire location through unchanged', () => {
		let {events} = toRows('stolaf', 0, [wireEvent({location: 'Field'})])
		assert.equal(events[0].location, 'Field')
	})

	/**
	 * `eventKey` is `startTime|title`, and its own doc comment admits two
	 * events can collide. On the array path that was harmless -- `.find()`
	 * returned the first match. Here the second row violates `event`'s primary
	 * key, the whole transaction rolls back, and `writeSource` reports the
	 * source failed. Because the collision is in the upstream feed, every
	 * refresh after it fails identically: that calendar freezes at its last
	 * good window until somebody edits the feed. Two same-titled all-day events
	 * on one date are the easiest way to hit it, since an all-day event's
	 * `startTime` is local midnight.
	 *
	 * First wins, matching what `.find()` did.
	 */
	it('keeps the first of two wire events that share an event key', () => {
		let first = wireEvent({
			isAllDay: true,
			startTime: '2026-09-15T05:00:00Z',
			endTime: '2026-09-16T04:59:59Z',
			location: 'Field',
		})
		let second = {...first, location: 'Gym', description: 'The other one'}

		let {events, occurrences, tags} = toRows('stolaf', 0, [first, second])

		assert.equal(events.length, 1)
		assert.equal(occurrences.length, 1)
		assert.equal(events[0].location, 'Field', 'the first copy wins, as `.find()` did')
		assert.deepEqual(JSON.parse(events[0].wire), first)
		assert.deepEqual(
			tags.map((tag) => `${tag.axis}|${tag.value}`),
			['category|Sports', 'organization|Athletics'],
			'the dropped copy contributes no tags either',
		)
	})

	it('keeps the occurrence at the same index as its event when a duplicate is dropped', () => {
		let duplicated = wireEvent({title: 'Twice', startTime: '2026-09-20T18:00:00Z'})
		let other = wireEvent({title: 'Once', startTime: '2026-09-21T18:00:00Z'})

		let {events, occurrences} = toRows('stolaf', 0, [duplicated, duplicated, other])

		assert.deepEqual(
			events.map((event) => event.eventKey),
			occurrences.map((occurrence) => occurrence.eventKey),
		)
		assert.equal(events.length, 2)
	})
})
