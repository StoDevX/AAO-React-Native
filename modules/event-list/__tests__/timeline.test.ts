import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

import {
	HOUR_HEIGHT,
	MAX_DEPTH,
	MAX_WINDOW_HOURS,
	MIN_BLOCK_HEIGHT,
	MIN_WINDOW_HOURS,
	timelineBlocks,
	timelineEntries,
	timelineWindow,
} from '../timeline'

/**
 * Local-time strings, deliberately without a `Z`: the window is computed with
 * `startOf('hour')` in local time, so a UTC literal would make these
 * assertions depend on the machine's timezone.
 */
function makeEvent(overrides: Partial<EventType> = {}): EventType {
	let startTime = overrides.startTime ?? moment('2026-08-17T07:45:00')
	let endTime = overrides.endTime ?? moment('2026-08-17T08:45:00')
	let config = overrides.config ?? {startTime: true, endTime: true, subtitle: 'location' as const}
	let isAllDay = !config.startTime && !config.endTime
	let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime,
		endTime,
		isAllDay,
		isMultiDay,
		isSameInstant,
		isOngoing: false,
		links: [],
		categories: [],
		config,
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

	test('the window runs from the floored start to the ceiled end, inclusive', () => {
		// Measured from Calendar.app: a 12:40-13:40 event draws a 12:00-14:00
		// window with three hour labels and a 113pt card.
		let window = timelineWindow(
			makeEvent({
				startTime: moment('2026-08-17T12:40:00'),
				endTime: moment('2026-08-17T13:40:00'),
			}),
		)

		expect(window?.hours.map((hour) => hour.format('HH:mm'))).toEqual(['12:00', '13:00', '14:00'])
	})

	test('a two-hour window is 80pt tall', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.height).toBe(2 * HOUR_HEIGHT)
	})

	test('a four-hour window is 160pt tall', () => {
		let window = timelineWindow(
			makeEvent({
				startTime: moment('2026-08-17T07:45:00'),
				endTime: moment('2026-08-17T11:30:00'),
			}),
		)

		expect(window?.height).toBe(4 * HOUR_HEIGHT)
	})

	test('a span over four hours is capped at the max', () => {
		let window = timelineWindow(
			makeEvent({
				startTime: moment('2026-08-17T07:45:00'),
				endTime: moment('2026-08-17T13:00:00'),
			}),
		)

		expect(window?.end.format('HH:mm')).toBe('11:00')
		expect(window?.hours).toHaveLength(MAX_WINDOW_HOURS + 1)
	})

	test('a span under two hours is floored to the min, having too little context otherwise', () => {
		// A fifteen-minute event would otherwise get a 1-hour window in which it
		// fills a quarter of the height with almost no surrounding context, and a
		// card barely taller than a single row.
		let window = timelineWindow(
			makeEvent({
				startTime: moment('2026-08-17T12:10:00'),
				endTime: moment('2026-08-17T12:25:00'),
			}),
		)

		expect(window?.start.format('HH:mm')).toBe('12:00')
		expect(window?.end.format('HH:mm')).toBe('14:00')
		expect(window?.hours).toHaveLength(MIN_WINDOW_HOURS + 1)
	})

	test('an all-day event has no window, having no position', () => {
		let allDay = makeEvent({config: {startTime: false, endTime: false, subtitle: 'location'}})

		expect(timelineWindow(allDay)).toBeNull()
	})

	test('a multi-day event has no window, filling it end to end', () => {
		let long = makeEvent({endTime: moment('2026-08-20T18:00:00')})

		expect(timelineWindow(long)).toBeNull()
	})

	test('an event starting exactly on the hour gets an hour of lead-in', () => {
		let onTheHour = makeEvent({
			startTime: moment('2026-08-17T09:00:00'),
			endTime: moment('2026-08-17T10:00:00'),
		})
		let window = timelineWindow(onTheHour)

		// The lead-in rule applies first; the resulting 08:00-10:00 span already
		// meets the two-hour floor, so nothing further stretches it.
		expect(window?.start.format('HH:mm')).toBe('08:00')
		expect(window?.end.format('HH:mm')).toBe('10:00')
	})

	test('an event past the hour anchors to the hour holding it', () => {
		let window = timelineWindow(makeEvent())

		expect(window?.start.format('HH:mm')).toBe('07:00')
	})
})

describe('timelineBlocks', () => {
	test('a block sits proportionally below the window top', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')], 'stolaf|a')

		// 07:45 is three quarters of an hour past the 07:00 window top.
		expect(block.top).toBe(0.75 * HOUR_HEIGHT)
		expect(block.height).toBe(HOUR_HEIGHT)
	})

	test('an event running past the window is clipped at its foot', () => {
		let window = timelineWindow(makeEvent())
		let long = entry('stolaf', 'a', {endTime: moment('2026-08-17T18:00:00')})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [long], 'stolaf|a')

		expect(block.top + block.height).toBe(window?.height)
	})

	test('an event starting before the window is clipped at its head', () => {
		let window = timelineWindow(makeEvent())
		let early = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T05:00:00'),
			endTime: moment('2026-08-17T07:45:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [early], 'stolaf|a')

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
		expect(timelineBlocks(window!, [later], 'stolaf|b')).toEqual([])
	})

	test('an all-day event is dropped, having no position', () => {
		let window = timelineWindow(makeEvent())
		let allDay = entry('stolaf', 'b', {
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(timelineBlocks(window!, [allDay], 'stolaf|b')).toEqual([])
	})

	test('a multi-day neighbour is dropped, since it would fill the window', () => {
		let window = timelineWindow(makeEvent())
		let spanning = entry('northfield', 'b', {
			startTime: moment('2026-08-16T09:00:00'),
			endTime: moment('2026-08-19T09:00:00'),
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(timelineBlocks(window!, [spanning], 'nobody|home')).toEqual([])
	})

	test('a very short event keeps a legible height', () => {
		let window = timelineWindow(makeEvent())
		let brief = entry('stolaf', 'a', {endTime: moment('2026-08-17T07:50:00')})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [brief], 'stolaf|a')

		// Five minutes is 3.3pt at 40pt/hour, too short to read.
		expect(block.height).toBe(20)
	})

	test('the current event is marked isCurrent and every other block is not', () => {
		let window = timelineWindow(makeEvent())
		let neighbour = entry('northfield', 'b', {
			startTime: moment('2026-08-17T08:00:00'),
			endTime: moment('2026-08-17T09:00:00'),
		})
		let blocks = timelineBlocks(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			window!,
			[entry('stolaf', 'a'), neighbour],
			'stolaf|a',
		)

		let current = blocks.find((block) => block.key === 'stolaf|a')
		let others = blocks.filter((block) => block.key !== 'stolaf|a')

		expect(current?.isCurrent).toBe(true)
		expect(others.every((block) => !block.isCurrent)).toBe(true)
	})

	test('the current event is last in the returned array, so it paints on top', () => {
		let window = timelineWindow(makeEvent())
		let neighbour = entry('northfield', 'b', {
			startTime: moment('2026-08-17T08:00:00'),
			endTime: moment('2026-08-17T09:00:00'),
		})
		let blocks = timelineBlocks(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			window!,
			[entry('stolaf', 'a'), neighbour],
			'stolaf|a',
		)

		expect(blocks.at(-1)?.key).toBe('stolaf|a')
	})

	test('two overlapping neighbours get depths 0 and 1', () => {
		let window = timelineWindow(makeEvent())
		let blocks = timelineBlocks(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			window!,
			[
				entry('stolaf', 'a'),
				entry('northfield', 'b', {
					startTime: moment('2026-08-17T08:00:00'),
					endTime: moment('2026-08-17T09:00:00'),
				}),
			],
			// Neither entry is the current event here -- this exercises the
			// neighbour sweep on its own.
			'nobody|home',
		)

		expect(blocks.map((block) => block.depth)).toEqual([0, 1])
	})

	test('the current event does not consume a depth slot from an overlapping neighbour', () => {
		let window = timelineWindow(makeEvent())
		let neighbour = entry('northfield', 'b')
		let blocks = timelineBlocks(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			window!,
			[entry('stolaf', 'a'), neighbour],
			'stolaf|a',
		)

		let neighbourBlock = blocks.find((block) => block.key === 'northfield|b')
		expect(neighbourBlock?.depth).toBe(0)
	})

	test('two non-overlapping neighbours both get depth 0', () => {
		// A window sized to the default 07:45-08:45 event would end at 09:00,
		// clipping the second entry's own hour -- widen it to the four-hour cap
		// so both events land fully inside, which is what this test means to
		// exercise.
		let window = timelineWindow(makeEvent({endTime: moment('2026-08-17T13:00:00')}))
		let blocks = timelineBlocks(
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			window!,
			[
				entry('stolaf', 'a'),
				entry('northfield', 'b', {
					startTime: moment('2026-08-17T09:00:00'),
					endTime: moment('2026-08-17T10:00:00'),
				}),
			],
			'nobody|home',
		)

		expect(blocks.map((block) => block.depth)).toEqual([0, 0])
	})

	test('depth is clamped at MAX_DEPTH with five overlapping neighbours', () => {
		let window = timelineWindow(makeEvent())
		let overlapping = ['a', 'b', 'c', 'd', 'e'].map((key) => entry('stolaf', key))
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let blocks = timelineBlocks(window!, overlapping, 'nobody|home')

		expect(blocks.map((block) => block.depth)).toEqual([0, 1, 2, MAX_DEPTH, MAX_DEPTH])
	})

	test('a zero-length event on the hour still draws', () => {
		let window = timelineWindow(makeEvent())
		let instant = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T07:00:00'),
			endTime: moment('2026-08-17T07:00:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [instant], 'stolaf|a')

		expect(block).toBeDefined()
		expect(block.top).toBe(0)
		expect(block.height).toBe(MIN_BLOCK_HEIGHT)
	})

	test('an event ending exactly at the window start is excluded', () => {
		let window = timelineWindow(makeEvent())
		let before = entry('stolaf', 'b', {
			startTime: moment('2026-08-17T06:00:00'),
			endTime: moment('2026-08-17T07:00:00'),
		})

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(timelineBlocks(window!, [before], 'stolaf|b')).toEqual([])
	})

	test('a block is keyed by source and event together', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [entry('stolaf', 'a')], 'stolaf|a')

		// The same event can reach the list from two merged calendars, so the
		// event key alone collides -- as it does in the list's rows.
		expect(block.key).toBe('stolaf|a')
	})

	test('an entry list holding only the current event yields one block, current, at depth 0', () => {
		let window = timelineWindow(makeEvent())
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let blocks = timelineBlocks(window!, [entry('stolaf', 'a')], 'stolaf|a')

		expect(blocks).toHaveLength(1)
		expect(blocks[0].isCurrent).toBe(true)
		expect(blocks[0].depth).toBe(0)
	})

	test('a block near the window foot is pulled up rather than overflowing', () => {
		// Widened to the four-hour cap, as above, so the window's foot lands at
		// 11:00 -- otherwise the default event's own window would end at 09:00,
		// long before the late entry even starts.
		let window = timelineWindow(makeEvent({endTime: moment('2026-08-17T13:00:00')}))
		// Starts one minute before the window ends and runs long past it: the
		// min-height floor would otherwise push its foot past the container.
		let late = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T10:59:00'),
			endTime: moment('2026-08-17T23:59:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [late], 'stolaf|a')

		expect(block.top + block.height).toBeLessThanOrEqual(window?.height ?? 0)
		expect(block.height).toBe(MIN_BLOCK_HEIGHT)
	})

	test('no block ever starts above the window top, even in a short window', () => {
		// The default event's window floors to two hours -- the invariant has to
		// hold against that dynamic height.
		let window = timelineWindow(makeEvent())
		let early = entry('stolaf', 'a', {
			startTime: moment('2026-08-17T00:00:00'),
			endTime: moment('2026-08-17T07:05:00'),
		})
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let [block] = timelineBlocks(window!, [early], 'stolaf|a')

		expect(block.top).toBeGreaterThanOrEqual(0)
		expect(block.top + block.height).toBeLessThanOrEqual(window?.height ?? 0)
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
