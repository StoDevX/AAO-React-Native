import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'

import {daysWithEvents, deriveDays, eventsOnDay, occursOn} from '../days'
import type {SourcedEvent} from '../types'

// A Sunday, so "this week" runs 2026-08-23 (Sun) through 2026-08-29 (Sat).
const NOW = moment('2026-08-23T12:00:00Z')

function event(start: string, end = start, isOngoing = false): SourcedEvent {
	let startTime = moment(start)
	return {
		sourceId: 'a',
		key: start,
		event: {startTime, endTime: moment(end), isOngoing},
	} as unknown as SourcedEvent
}

function isoDays(days: ReturnType<typeof deriveDays>): string[] {
	return days.map((d) => d.format('YYYY-MM-DD'))
}

describe('deriveDays', () => {
	test('yields the current week when nothing lies ahead', () => {
		let result = deriveDays([], NOW)
		expect(result.map((d) => d.format('YYYY-MM-DD'))).toEqual([
			'2026-08-23',
			'2026-08-24',
			'2026-08-25',
			'2026-08-26',
			'2026-08-27',
			'2026-08-28',
			'2026-08-29',
		])
	})

	test('yields the current week when every event is past or ongoing', () => {
		let events = [event('2026-08-22T10:00:00Z'), event('2026-09-15T10:00:00Z', undefined, true)]
		expect(deriveDays(events, NOW)).toHaveLength(7)
	})

	test('spans whole weeks, Sunday through Saturday', () => {
		let result = deriveDays([event('2026-08-25T10:00:00Z')], NOW)
		expect(result).toHaveLength(7)
		expect(result[0].day()).toBe(0)
		expect(result[6].day()).toBe(6)
		expect(isoDays(result)[0]).toBe('2026-08-23')
		expect(isoDays(result).at(-1)).toBe('2026-08-29')
	})

	test('leads with Sunday of the current week, not with today', () => {
		// A midweek `now`, so the leading Sunday is a day the range would not
		// reach if it started at today.
		let wednesday = moment('2026-08-26T12:00:00Z')
		let result = deriveDays([event('2026-08-27T10:00:00Z')], wednesday)
		expect(isoDays(result)[0]).toBe('2026-08-23')
	})

	test("extends through the Saturday of the last event's week", () => {
		// Last event is Wed 2026-09-02, so the strip runs to Sat 2026-09-05.
		let result = deriveDays([event('2026-08-23T10:00:00Z'), event('2026-09-02T10:00:00Z')], NOW)
		expect(isoDays(result).at(-1)).toBe('2026-09-05')
		expect(result).toHaveLength(14)
	})

	test('returns a continuous run of unique ascending days', () => {
		let result = deriveDays(
			[event('2026-09-02T10:00:00Z'), event('2026-08-23T10:00:00Z'), event('2026-08-23T18:00:00Z')],
			NOW,
		)
		let iso = isoDays(result)
		expect(new Set(iso).size).toBe(iso.length)
		for (let i = 1; i < result.length; i++) {
			expect(result[i].diff(result[i - 1], 'days')).toBe(1)
		}
	})

	test('excludes past and ongoing events from the range end', () => {
		let events = [
			event('2026-08-22T10:00:00Z'),
			event('2026-09-20T10:00:00Z', undefined, true),
			event('2026-08-24T10:00:00Z'),
		]
		let result = deriveDays(events, NOW)
		// Only the 2026-08-24 event counts, so the strip is just this week.
		expect(isoDays(result)).toEqual([
			'2026-08-23',
			'2026-08-24',
			'2026-08-25',
			'2026-08-26',
			'2026-08-27',
			'2026-08-28',
			'2026-08-29',
		])
	})

	test('fills gap days between events', () => {
		let result = deriveDays([event('2026-08-24T10:00:00Z'), event('2026-08-27T10:00:00Z')], NOW)
		expect(isoDays(result)).toContain('2026-08-25')
		expect(isoDays(result)).toContain('2026-08-26')
	})

	// `deriveDays`' signature takes two `Moment`s and promises nothing about
	// which zone either was built in, so the range end has to be measured as a
	// calendar date rather than as an instant. Measuring it as an instant runs
	// the range a day long or a day short depending on which zone each argument
	// actually carries, and the strip's snapping assumes whole weeks.
	describe('when the events and the clock are in different zones', () => {
		let chicagoSunday = () => moment.tz('2026-09-06T12:00:00', 'America/Chicago')

		test('spans whole weeks for a device west of campus', () => {
			let losAngeles = moment.tz('2026-09-19T15:00:00-05:00', 'America/Los_Angeles')
			let result = deriveDays([event(losAngeles.toISOString())], chicagoSunday())

			expect(result).toHaveLength(14)
			expect(isoDays(result).at(-1)).toBe('2026-09-19')
		})

		test('keeps the last event day in range for a device east of campus', () => {
			// Midnight-crossing is the case that bites: this instant is still the
			// 19th on campus but already the 20th on the device, and the list keys
			// its sections off the device's reading.
			let tokyo = moment.tz('2026-09-20T13:00:00+09:00', 'Asia/Tokyo')
			let result = deriveDays([event(tokyo.toISOString())], chicagoSunday())

			expect(result).toHaveLength(21)
			expect(isoDays(result)).toContain('2026-09-20')
		})
	})

	test('measures the week in the zone of the moment it is given', () => {
		// 02:00 UTC Sunday is still 21:00 Saturday in this zone, so the week --
		// and its leading Sunday -- is the earlier one. deriveDays must not
		// silently reinterpret `now` in UTC.
		let now = moment.tz('2026-09-06T02:00:00Z', 'America/Chicago')
		let result = deriveDays([event('2026-09-10T10:00:00Z')], now)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-30')
	})
})

describe('occursOn', () => {
	let sunday = moment('2026-08-23T00:00:00Z')

	test('an event starting that day occurs on it', () => {
		expect(occursOn(event('2026-08-23T18:00:00Z'), sunday)).toBe(true)
	})

	test('an event starting another day does not', () => {
		expect(occursOn(event('2026-08-24T18:00:00Z'), sunday)).toBe(false)
	})

	test('an ongoing event spanning that day occurs on it', () => {
		let spanning = event('2026-08-20T10:00:00Z', '2026-08-26T10:00:00Z', true)
		expect(occursOn(spanning, sunday)).toBe(true)
	})

	test('an ongoing event that ended before that day does not', () => {
		let past = event('2026-08-18T10:00:00Z', '2026-08-20T10:00:00Z', true)
		expect(occursOn(past, sunday)).toBe(false)
	})
})

describe('eventsOnDay', () => {
	test('keeps only the events on that day, in start order', () => {
		let events = [
			event('2026-08-24T09:00:00Z'),
			event('2026-08-23T18:00:00Z'),
			event('2026-08-23T09:00:00Z'),
		]
		let result = eventsOnDay(events, moment('2026-08-23T00:00:00Z'))
		expect(result.map((entry) => entry.key)).toEqual([
			'2026-08-23T09:00:00Z',
			'2026-08-23T18:00:00Z',
		])
	})

	test('returns nothing for a day with no events', () => {
		expect(eventsOnDay([event('2026-08-24T09:00:00Z')], moment('2026-08-23T00:00:00Z'))).toEqual([])
	})
})

describe('daysWithEvents', () => {
	test('names the ISO dates that carry at least one event', () => {
		let days = deriveDays([], NOW)
		let events = [event('2026-08-24T09:00:00Z'), event('2026-08-24T18:00:00Z')]
		expect(daysWithEvents(events, days)).toEqual(new Set(['2026-08-24']))
	})

	test('is empty when no day in range carries one', () => {
		expect(daysWithEvents([], deriveDays([], NOW)).size).toBe(0)
	})
})
