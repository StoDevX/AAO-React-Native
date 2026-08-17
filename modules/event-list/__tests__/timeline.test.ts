import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import type {EventType} from '@frogpond/event-type'

import {
	HOUR_HEIGHT,
	MIN_BLOCK_HEIGHT,
	timelineBlocks,
	timelineEntries,
	timelineWindow,
	WINDOW_HEIGHT,
} from '../timeline'

/**
 * Local-time strings, deliberately without a `Z`: the window is computed with
 * `startOf('hour')` in local time, so a UTC literal would make these
 * assertions depend on the machine's timezone.
 */
function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T07:45:00'),
		endTime: moment('2026-08-17T08:45:00'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

function entry(sourceId: string, key: string, overrides: Partial<EventType> = {}) {
	return {sourceId, key, event: makeEvent(overrides)}
}

describe('timelineWindow', () => {
	test('it begins at the top of the hour holding the start', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.start.format('HH:mm')).toBe('07:00')
	})

	test('it spans four hourly gridlines', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.hours.map((hour) => hour.format('HH:mm'))).toEqual([
			'07:00',
			'08:00',
			'09:00',
			'10:00',
		])
	})

	test('an all-day event has no window, having no position', () => {
		let allDay = makeEvent({config: {startTime: false, endTime: false, subtitle: 'location'}})

		expect(timelineWindow(allDay)).toBeNull()
	})
})

describe('timelineBlocks', () => {
	test('a block sits proportionally below the window top', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')])

		// 07:45 is three quarters of an hour past the 07:00 window top.
		expect(block.top).toBe(0.75 * HOUR_HEIGHT)
		expect(block.height).toBe(HOUR_HEIGHT)
	})

	test('an event running past the window is clipped at its foot', () => {
		let window = timelineWindow(makeEvent())
		let long = entry('stolaf', 'a', {endTime: moment('2026-08-20T18:00:00')})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [long])

		expect(block.top + block.height).toBe(WINDOW_HEIGHT)
	})

	test('an event starting before the window is clipped at its head', () => {
		let window = timelineWindow(makeEvent())
		let early = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T05:00:00'),
			endTime: moment('2026-08-17T07:45:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [early])

		expect(block.top).toBe(0)
		expect(block.height).toBe(0.75 * HOUR_HEIGHT)
	})

	test('an event outside the window is dropped', () => {
		let window = timelineWindow(makeEvent())
		let later = entry('stolaf', 'b', {
			startTime: moment('2026-08-17T14:00:00'),
			endTime: moment('2026-08-17T15:00:00'),
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(timelineBlocks(window!, [later])).toEqual([])
	})

	test('an all-day event is dropped, having no position', () => {
		let window = timelineWindow(makeEvent())
		let allDay = entry('stolaf', 'b', {
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(timelineBlocks(window!, [allDay])).toEqual([])
	})

	test('a very short event keeps a legible height', () => {
		let window = timelineWindow(makeEvent())
		let brief = entry('stolaf', 'a', {endTime: moment('2026-08-17T07:50:00')})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [brief])

		// Five minutes is 3.3pt at 40pt/hour, too short to read.
		expect(block.height).toBe(20)
	})

	test('overlapping events split into side-by-side columns', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let blocks = timelineBlocks(window!, [
			entry('stolaf', 'a'),
			entry('northfield', 'b', {
				startTime: moment('2026-08-17T08:00:00'),
				endTime: moment('2026-08-17T09:00:00'),
			}),
		])

		expect(blocks.map((block) => block.column)).toEqual([0, 1])
		expect(blocks.every((block) => block.columnCount === 2)).toBe(true)
	})

	test('events that do not overlap share one column', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let blocks = timelineBlocks(window!, [
			entry('stolaf', 'a'),
			entry('northfield', 'b', {
				startTime: moment('2026-08-17T09:00:00'),
				endTime: moment('2026-08-17T10:00:00'),
			}),
		])

		expect(blocks.map((block) => block.column)).toEqual([0, 0])
		expect(blocks.every((block) => block.columnCount === 1)).toBe(true)
	})

	test('a block is keyed by source and event together', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')])

		// The same event can reach the list from two merged calendars, so the
		// event key alone collides -- as it does in the list's rows.
		expect(block.key).toBe('stolaf|a')
	})

	test('a block near the window foot is pulled up rather than overflowing', () => {
		let window = timelineWindow(makeEvent())
		// Starts one minute before the window ends and runs for days: the
		// min-height floor would otherwise push its foot past the container.
		let late = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T10:59:00'),
			endTime: moment('2026-08-20T18:00:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [late])

		expect(block.top + block.height).toBeLessThanOrEqual(WINDOW_HEIGHT)
		expect(block.height).toBe(MIN_BLOCK_HEIGHT)
	})

	test('no block ever starts above the window top', () => {
		let window = timelineWindow(makeEvent())
		let early = entry('stolaf', 'a', {
			startTime: moment('2026-08-16T22:00:00'),
			endTime: moment('2026-08-17T07:05:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [early])

		expect(block.top).toBeGreaterThanOrEqual(0)
		expect(block.top + block.height).toBeLessThanOrEqual(WINDOW_HEIGHT)
	})
})

describe('timelineEntries', () => {
	test('it puts the current event among its neighbours', () => {
		let current = entry('stolaf', 'a')
		let neighbour = entry('northfield', 'b')

		expect(timelineEntries(current, [neighbour])).toEqual([current, neighbour])
	})

	test('it does not draw the current event twice', () => {
		let current = entry('stolaf', 'a')

		// The merged list holds the current event already whenever its calendar
		// is switched on, which is the usual case.
		let result = timelineEntries(current, [entry('stolaf', 'a'), entry('northfield', 'b')])
		expect(result).toHaveLength(2)
		expect(result[0]).toBe(current)
	})
})
