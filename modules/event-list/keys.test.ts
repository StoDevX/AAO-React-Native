import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import moment from 'moment'

import type {EventType} from '../event-type/index.ts'
import {dedupeKey, eventKey} from './keys.ts'

function event(over: Partial<EventType> = {}): EventType {
	return {
		title: 'Soccer',
		description: '',
		location: '',
		startTime: moment.utc('2026-09-15T18:00:00Z'),
		endTime: moment.utc('2026-09-15T20:00:00Z'),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...over,
	} as EventType
}

describe('eventKey', () => {
	it('joins the ISO start time and the title verbatim', () => {
		assert.equal(eventKey(event()), '2026-09-15T18:00:00.000Z|Soccer')
	})

	it('keeps titles that differ only by punctuation apart', () => {
		assert.notEqual(
			eventKey(event({title: "Men's Soccer vs Carroll"})),
			eventKey(event({title: "Men's Soccer vs. Carroll"})),
		)
	})
})

describe('dedupeKey', () => {
	it('folds a title to its letters and digits', () => {
		assert.equal(
			dedupeKey(event({title: "Men's Soccer vs. Carroll"})),
			'2026-09-15T18:00:00.000Z|men s soccer vs carroll',
		)
	})

	it('matches titles differing only by punctuation across sources', () => {
		assert.equal(
			dedupeKey(event({title: "Men's Soccer vs Carroll University"})),
			dedupeKey(event({title: 'Men’s Soccer vs. Carroll University'})),
		)
	})
})
