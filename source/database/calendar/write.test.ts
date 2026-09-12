import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import type {WireEvent} from '../../../modules/ccc-calendar/parsers/events.ts'
import {ensureSchema} from '../schema.ts'
import type {SqlRunner} from '../sql.ts'
import {openTestDatabase} from '../testing/harness.ts'
import {retentionFor, writeSource} from './write.ts'

// A fixed clock, so every test's future/past/stale boundaries are the same
// known dates rather than whatever day the suite happens to run on.
const NOW = new Date(2026, 8, 15, 12, 0, 0)
const RETENTION = retentionFor(NOW)

function freshDb(): SqlRunner {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	return runner
}

function occurrenceRows(runner: SqlRunner): {event_key: string; start_utc: number}[] {
	return runner.all({
		sql: 'select event_key, start_utc from occurrence order by event_key, start_utc',
		params: [],
	})
}

function wireEvent(over: Partial<WireEvent> = {}): WireEvent {
	return {
		dataSource: 'test',
		startTime: '2026-09-15T18:00:00Z',
		endTime: '2026-09-15T20:00:00Z',
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		title: 'Event',
		description: '',
		location: '',
		isOngoing: false,
		links: [],
		categories: [],
		organization: undefined,
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...over,
	}
}

// A `YYYY-MM-DD` string shifted by `days` (positive or negative), entirely
// in UTC -- same technique `rows.ts` uses, kept local here since it's
// test-only.
function shiftUtcDate(date: string, days: number): string {
	let instant = new Date(`${date}T00:00:00Z`)
	instant.setUTCDate(instant.getUTCDate() + days)
	return instant.toISOString().slice(0, 10)
}

describe('retentionFor', () => {
	it("gives today's local midnight and the date 30 days before it", () => {
		assert.equal(RETENTION.todayDate, '2026-09-15')
		assert.equal(RETENTION.cutoffDate, '2026-08-16')
		assert.equal(RETENTION.todayUtc, new Date(2026, 8, 15).getTime())
		assert.equal(RETENTION.cutoffUtc, new Date(2026, 7, 16).getTime())
	})
})

describe('writeSource', () => {
	it('replaces a future event present in a later fetch, without duplicating it', () => {
		let runner = freshDb()
		let event = wireEvent({
			title: 'Future',
			startTime: '2026-09-20T18:00:00Z',
			endTime: '2026-09-20T20:00:00Z',
		})

		writeSource(runner, 'stolaf', 0, [event], RETENTION)
		writeSource(runner, 'stolaf', 0, [event], RETENTION)

		assert.equal(occurrenceRows(runner).length, 1)
	})

	it('removes a future event absent from a later fetch', () => {
		let runner = freshDb()
		let event = wireEvent({
			title: 'Future',
			startTime: '2026-09-20T18:00:00Z',
			endTime: '2026-09-20T20:00:00Z',
		})

		writeSource(runner, 'stolaf', 0, [event], RETENTION)
		writeSource(runner, 'stolaf', 0, [], RETENTION)

		assert.deepEqual(occurrenceRows(runner), [])
	})

	it('keeps a past event absent from a later fetch -- the back half of the window fills as events age', () => {
		let runner = freshDb()
		let event = wireEvent({
			title: 'Past',
			startTime: '2026-09-01T18:00:00Z',
			endTime: '2026-09-01T20:00:00Z',
		})

		writeSource(runner, 'stolaf', 0, [event], RETENTION)
		writeSource(runner, 'stolaf', 0, [], RETENTION)

		let rows = occurrenceRows(runner)
		assert.equal(rows.length, 1)
		assert.equal(rows[0].start_utc, Date.parse('2026-09-01T18:00:00Z'))
	})

	// The case a start-based boundary silently breaks: an event that started
	// before today but is still running. Under a start-based replace, this
	// event is never deleted (it started in the past), never pruned (it is
	// recent), and never re-inserted (once retained, its old key blocks a
	// fresh insert under a *matching* key) -- so an edited title never lands,
	// or worse, an edited title with a *different* key lands alongside the
	// stale one. Asserting the row merely exists would pass either way;
	// asserting the title is what discriminates.
	it('replaces an ongoing event present in a later fetch, so an edited title lands', () => {
		let runner = freshDb()
		let draft = wireEvent({
			title: 'Festival (draft)',
			startTime: '2026-09-10T18:00:00Z',
			endTime: '2026-09-25T20:00:00Z',
		})
		writeSource(runner, 'stolaf', 0, [draft], RETENTION)

		let final = wireEvent({
			title: 'Festival (final)',
			startTime: '2026-09-10T18:00:00Z',
			endTime: '2026-09-25T20:00:00Z',
		})
		writeSource(runner, 'stolaf', 0, [final], RETENTION)

		let titles = runner.all<{title: string}>({
			sql: 'select title from event where source_id = ?',
			params: ['stolaf'],
		})
		assert.deepEqual(titles, [{title: 'Festival (final)'}])
	})

	it('prunes a past event older than the retention cutoff', () => {
		let runner = freshDb()
		let event = wireEvent({
			title: 'Old',
			startTime: '2026-08-01T18:00:00Z',
			endTime: '2026-08-01T20:00:00Z',
		})

		writeSource(runner, 'stolaf', 0, [event], RETENTION)
		writeSource(runner, 'stolaf', 0, [], RETENTION)

		assert.deepEqual(occurrenceRows(runner), [])
	})

	// The trap: an all-day row's end_utc is the raw wire instant, not a
	// meaningful ordering value for the (end-based) retention boundary.
	// `cutoffUtc` is Chicago *local* midnight of `cutoffDate`; this
	// iCal-style all-day event's own end instant is *UTC* midnight of that
	// same date, five hours earlier. For this fixture's actual numbers
	// (cutoffDate = 2026-08-16, cutoffUtc = 2026-08-16T05:00:00Z):
	//
	//   end 2026-08-16T00:00:00Z -> end_date 2026-08-16
	//     date arm   (end_date < cutoffDate): false -> survives
	//     instant arm (end_utc  < cutoffUtc):  true  -> pruned
	//
	// The date arm reads this occurrence as ending exactly at the cutoff,
	// which retention keeps; comparing on end_utc instead reads it as
	// already five hours short of the cutoff and prunes the one row this
	// case exists to keep. The event starts a day earlier so `toRows`'
	// zero-length guard doesn't stretch `end_date` past the boundary this
	// fixture is built to sit on.
	it('keeps a finished past all-day event at the retention boundary, compared on dates rather than instants', () => {
		let runner = freshDb()
		let event = wireEvent({
			title: 'Exhibit',
			isAllDay: true,
			startTime: `${shiftUtcDate(RETENTION.cutoffDate, -1)}T00:00:00Z`,
			endTime: `${RETENTION.cutoffDate}T00:00:00Z`,
		})

		writeSource(runner, 'stolaf', 0, [event], RETENTION)
		writeSource(runner, 'stolaf', 0, [], RETENTION)

		assert.equal(occurrenceRows(runner).length, 1)
	})

	it("leaves one source's rows untouched while writing another", () => {
		let runner = freshDb()
		let stolafEvent = wireEvent({
			title: 'Chapel',
			startTime: '2026-09-20T18:00:00Z',
			endTime: '2026-09-20T20:00:00Z',
		})
		writeSource(runner, 'stolaf', 0, [stolafEvent], RETENTION)
		let before = runner.all<{event_key: string; start_utc: number}>({
			sql: 'select event_key, start_utc from occurrence where source_id = ? order by event_key, start_utc',
			params: ['stolaf'],
		})

		let presenceEvent = wireEvent({
			title: 'Game',
			startTime: '2026-09-21T18:00:00Z',
			endTime: '2026-09-21T20:00:00Z',
		})
		writeSource(runner, 'presence', 1, [presenceEvent], RETENTION)

		let after = runner.all<{event_key: string; start_utc: number}>({
			sql: 'select event_key, start_utc from occurrence where source_id = ? order by event_key, start_utc',
			params: ['stolaf'],
		})
		assert.deepEqual(after, before)
	})

	it("leaves a source's previous rows intact when the write throws partway through", () => {
		let runner = freshDb()
		let seed = wireEvent({
			title: 'Seed',
			startTime: '2026-09-01T18:00:00Z',
			endTime: '2026-09-01T20:00:00Z',
		})
		writeSource(runner, 'stolaf', 0, [seed], RETENTION)
		let before = occurrenceRows(runner)

		// Two wire events with the same title and start time collapse to the
		// same event_key -- toRows does not dedupe within one source's own
		// fetch -- so the second insert violates event's primary key,
		// throwing partway through the write.
		let colliding = wireEvent({
			title: 'Dup',
			startTime: '2026-09-22T18:00:00Z',
			endTime: '2026-09-22T20:00:00Z',
		})
		assert.throws(() => writeSource(runner, 'stolaf', 0, [colliding, colliding], RETENTION))

		assert.deepEqual(occurrenceRows(runner), before)
	})
})
