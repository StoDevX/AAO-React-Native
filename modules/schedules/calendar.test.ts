import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {describe, it} from 'node:test'
import {normalizeCalendarInterval} from './index.ts'
import type {CalendarInterval} from './index.ts'
import {CALENDAR_CASES} from './__fixtures__/calendar.ts'

describe('normalizeCalendarInterval', () => {
	for (let {name, interval, timezone, expected} of CALENDAR_CASES) {
		it(name, () => {
			assert.deepEqual(normalizeCalendarInterval(interval, timezone), expected)
		})
	}

	it('ends a day with a skipped midnight at the following local midnight', () => {
		assert.deepEqual(normalizeCalendarInterval({date: '2026-09-06'}, 'America/Santiago'), {
			startMs: Date.UTC(2026, 8, 6, 4),
			endMs: Date.UTC(2026, 8, 7, 3),
			calendarDays: 1,
		})
	})

	for (let timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
		it('uses calendar dates independently of process timezone ' + timezone, () => {
			let result = spawnSync(
				process.execPath,
				[
					'--input-type=module',
					'-e',
					'import {normalizeCalendarInterval} from ' +
						JSON.stringify(new URL('calendar.ts', import.meta.url).href) +
						';' +
						'const cases = ' +
						JSON.stringify(CALENDAR_CASES) +
						';' +
						'console.log(JSON.stringify(cases.map(({interval, timezone}) => normalizeCalendarInterval(interval, timezone))))',
				],
				{env: {...process.env, TZ: timezone}, encoding: 'utf8'},
			)
			assert.equal(result.status, 0, result.stderr)
			assert.deepEqual(
				JSON.parse(result.stdout),
				CALENDAR_CASES.map(({expected}) => expected),
			)
		})
	}

	it('normalizes a singleton and a one-day range identically', () => {
		assert.deepEqual(
			normalizeCalendarInterval({date: '2026-03-08'}, 'America/Chicago'),
			normalizeCalendarInterval({start: '2026-03-08', end: '2026-03-08'}, 'America/Chicago'),
		)
	})

	it('does not mutate an authored interval', () => {
		let interval = Object.freeze({start: '2026-10-10', end: '2026-10-13'})
		normalizeCalendarInterval(interval, 'America/Chicago')
		assert.deepEqual(interval, {start: '2026-10-10', end: '2026-10-13'})
	})

	for (let date of [
		'2026-02-29',
		'2026-04-31',
		'2026-13-01',
		'2026-01-00',
		'2026-1-1',
		'2026-10-10T00:00:00Z',
		'',
	]) {
		it(`rejects the invalid date ${JSON.stringify(date)}`, () => {
			assert.throws(
				() => normalizeCalendarInterval({date}, 'America/Chicago'),
				/Invalid calendar date/u,
			)
		})
	}

	for (let interval of [
		{},
		{start: '2026-10-10'},
		{end: '2026-10-13'},
		{date: '2026-10-10', start: '2026-10-10', end: '2026-10-13'},
	]) {
		it(`rejects an incomplete or mixed interval: ${JSON.stringify(interval)}`, () => {
			assert.throws(
				() => normalizeCalendarInterval(interval as unknown as CalendarInterval, 'America/Chicago'),
				/requires date or both start and end/u,
			)
		})
	}

	it('rejects a reversed range', () => {
		assert.throws(
			() => normalizeCalendarInterval({start: '2026-10-13', end: '2026-10-10'}, 'America/Chicago'),
			/on or before/u,
		)
	})

	it('rejects an unknown timezone', () => {
		assert.throws(
			() => normalizeCalendarInterval({date: '2026-10-10'}, 'Invalid/Timezone'),
			RangeError,
		)
	})

	it('requires an explicit timezone instead of using the device zone', () => {
		assert.throws(
			() => normalizeCalendarInterval({date: '2026-10-10'}, ''),
			/timezone is required/u,
		)
	})
})
