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

	it('stores an all-day event as dates, with an exclusive end', () => {
		let {occurrences} = toRows('stolaf', 0, [
			wireEvent({
				isAllDay: true,
				startTime: '2026-09-11T00:00:00Z',
				endTime: '2026-12-06T23:59:59Z',
			}),
		])
		assert.equal(occurrences[0].allDay, true)
		assert.equal(occurrences[0].startDate, '2026-09-11')
		assert.equal(occurrences[0].endDate, '2026-12-07', 'end_date is exclusive')
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
