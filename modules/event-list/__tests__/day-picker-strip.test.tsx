import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'

import {DayPickerStrip, deriveDays} from '../day-picker-strip'
import type {SourcedEvent} from '../types'

// A Sunday, so "this week" runs 2026-08-23 (Sun) through 2026-08-29 (Sat).
const NOW = moment('2026-08-23T12:00:00Z')

function event(iso: string, isOngoing = false): SourcedEvent {
	return {
		sourceId: 'a',
		key: iso,
		event: {startTime: moment(iso), isOngoing},
	} as unknown as SourcedEvent
}

function isoDays(days: ReturnType<typeof deriveDays>): string[] {
	return days.map((d) => d.format('YYYY-MM-DD'))
}

describe('deriveDays', () => {
	test('returns empty array when events is empty', () => {
		expect(deriveDays([], NOW)).toEqual([])
	})

	test('returns empty array when every event is in the past or ongoing', () => {
		let events = [event('2026-08-22T10:00:00Z'), event('2026-09-15T10:00:00Z', true)]
		expect(deriveDays(events, NOW)).toEqual([])
	})

	test('spans whole weeks, Sunday through Saturday', () => {
		let result = deriveDays([event('2026-08-25T10:00:00Z')], NOW)
		expect(result).toHaveLength(7)
		expect(result[0].day()).toBe(0)
		expect(result[6].day()).toBe(6)
		expect(isoDays(result)[0]).toBe('2026-08-23')
		expect(isoDays(result).at(-1)).toBe('2026-08-29')
	})

	test('leads with Sunday of the current week regardless of the first event', () => {
		let result = deriveDays([event('2026-08-27T10:00:00Z')], NOW)
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
			event('2026-09-20T10:00:00Z', true),
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

	test('measures the week in the zone of the moment it is given', () => {
		// 02:00 UTC Sunday is still 21:00 Saturday in this zone, so the week --
		// and its leading Sunday -- is the earlier one. deriveDays must not
		// silently reinterpret `now` in UTC.
		let now = moment.tz('2026-09-06T02:00:00Z', 'America/Chicago')
		let result = deriveDays([event('2026-09-10T10:00:00Z')], now)
		expect(result[0].format('YYYY-MM-DD')).toBe('2026-08-30')
	})
})

describe('DayPickerStrip', () => {
	test('renders a cell for each day', async () => {
		let days = [
			moment('2026-08-23T12:00:00Z'),
			moment('2026-08-24T12:00:00Z'),
			moment('2026-08-25T12:00:00Z'),
		]

		await render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onScrollSettle={jest.fn()}
				onSelectDay={jest.fn()}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('23')).toBeTruthy()
		expect(screen.getByText('24')).toBeTruthy()
		expect(screen.getByText('25')).toBeTruthy()
	})

	test('renders single-letter weekday above date', async () => {
		let days = [moment('2026-08-23T12:00:00Z')] // Sunday

		await render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onScrollSettle={jest.fn()}
				onSelectDay={jest.fn()}
				selectedDay={days[0]}
			/>,
		)

		expect(screen.getByText('S')).toBeTruthy()
		expect(screen.getByText('23')).toBeTruthy()
	})

	test('calls onSelectDay when a day is tapped', async () => {
		let days = [moment('2026-08-23T12:00:00Z'), moment('2026-08-24T12:00:00Z')]
		let onSelectDay = jest.fn()

		await render(
			<DayPickerStrip
				days={days}
				now={NOW}
				onScrollSettle={jest.fn()}
				onSelectDay={onSelectDay}
				selectedDay={days[0]}
			/>,
		)

		fireEvent.press(screen.getByText('24'))

		expect(onSelectDay).toHaveBeenCalledTimes(1)
		let selectedDay = onSelectDay.mock.calls[0][0] as moment.Moment
		expect(selectedDay.format('YYYY-MM-DD')).toBe('2026-08-24')
	})

	test('renders nothing when days is empty', async () => {
		let result = await render(
			<DayPickerStrip
				days={[]}
				now={NOW}
				onScrollSettle={jest.fn()}
				onSelectDay={jest.fn()}
				selectedDay={null}
			/>,
		)

		expect(result.toJSON()).toBeNull()
	})
})
