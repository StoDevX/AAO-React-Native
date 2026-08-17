import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {isAllDay, isMultiDay} from './times'
import type {SourcedEvent} from './types'

/**
 * Measured from Calendar.app: hour labels fall 120px apart on a 3x screen.
 */
export const HOUR_HEIGHT = 40

/**
 * Calendar.app never shows more than four hourly gridlines, whatever the
 * event's own length.
 */
export const MAX_WINDOW_HOURS = 4

/**
 * Below this a fifteen-minute event would get a 1-hour window in which it
 * fills a quarter of the height with almost no surrounding context, and a
 * card barely taller than a single row.
 */
export const MIN_WINDOW_HOURS = 2

/**
 * Below this a block cannot carry its own title, so a fifteen-minute event
 * would draw as an unreadable sliver.
 */
export const MIN_BLOCK_HEIGHT = 20

export interface TimelineWindow {
	start: Moment
	end: Moment
	hours: Moment[]
	height: number
}

export interface TimelineBlock {
	key: string
	sourceId: string
	event: EventType
	top: number
	height: number
	column: number
	columnCount: number
}

/**
 * `time` rounded up to the next hour, or itself if already on the hour --
 * `startOf('hour')` alone always rounds down, which would drop a trailing
 * partial hour off the end of the window instead of keeping it in view.
 */
function ceilToHour(time: Moment): Moment {
	let floored = time.clone().startOf('hour')
	return floored.isSame(time) ? floored : floored.add(1, 'hour')
}

/**
 * The span an event's timeline covers, sized to the event and capped, or
 * `null` for an all-day or multi-day event -- neither has a position to draw.
 * A multi-day block would fill the window end to end and convey nothing about
 * where the event sits, the same degenerate case an all-day event already is.
 */
export function timelineWindow(event: EventType): TimelineWindow | null {
	if (isAllDay(event) || isMultiDay(event)) {
		return null
	}

	let start = event.startTime.clone().startOf('hour')

	// A block flush against the window's top reads as clipped rather than
	// positioned. An event starting exactly on the hour -- the common case for
	// campus events, not a rare one -- would otherwise get no lead-in at all,
	// so it borrows the hour before it instead.
	let onTheHour =
		event.startTime.minutes() === 0 &&
		event.startTime.seconds() === 0 &&
		event.startTime.milliseconds() === 0
	if (onTheHour) {
		start.subtract(1, 'hour')
	}

	let end = ceilToHour(event.endTime)

	if (end.diff(start, 'hours') > MAX_WINDOW_HOURS) {
		end = start.clone().add(MAX_WINDOW_HOURS, 'hours')
	} else if (end.diff(start, 'hours') < MIN_WINDOW_HOURS) {
		end = start.clone().add(MIN_WINDOW_HOURS, 'hours')
	}

	let span = end.diff(start, 'hours')
	let hours = Array.from({length: span + 1}, (_, index) => start.clone().add(index, 'hours'))

	return {start, end, hours, height: span * HOUR_HEIGHT}
}

function offsetIn(window: TimelineWindow, time: Moment): number {
	return (time.diff(window.start, 'minutes') / 60) * HOUR_HEIGHT
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(Math.max(value, low), high)
}

/**
 * The current event alongside its neighbours, without drawing it twice.
 *
 * The merged list already holds it whenever its calendar is switched on, which
 * is the usual case -- but not the only one, so it leads the list rather than
 * being assumed present.
 */
export function timelineEntries(
	current: SourcedEvent,
	neighbours: readonly SourcedEvent[],
): SourcedEvent[] {
	let isCurrent = (entry: SourcedEvent) =>
		entry.sourceId === current.sourceId && entry.key === current.key

	return [current, ...neighbours.filter((entry) => !isCurrent(entry))]
}

/**
 * Every entry that shows in the window, positioned and assigned a column.
 * All blocks are confined to the window — none start above or extend past its bounds.
 *
 * Columns come from a greedy sweep in start order: each block takes the first
 * column free at its top edge. `columnCount` is the widest the window ever
 * gets rather than per-cluster, so every block in one timeline is the same
 * width -- simpler, and indistinguishable over a span this short.
 */
export function timelineBlocks(
	window: TimelineWindow,
	entries: readonly SourcedEvent[],
): TimelineBlock[] {
	let positioned = entries
		.filter((entry) => !isAllDay(entry.event))
		.filter((entry) => {
			let {startTime, endTime} = entry.event
			// A zero-length event (`sillyZeroLength` in `times.ts`) has
			// `endTime === startTime`, so the ordinary overlap test --
			// `endTime.isAfter(window.start)` -- is false for one sitting right
			// on the window's top edge, and it drops out of its own timeline.
			// It is kept here as long as its instant falls in the window; an
			// event with real duration still needs to end after the window
			// starts, so one ending exactly at the window start is still
			// excluded, having genuinely not overlapped it.
			let isZeroLength = startTime.isSame(endTime)
			let overlapsWindow = isZeroLength
				? !startTime.isBefore(window.start)
				: endTime.isAfter(window.start)

			return startTime.isBefore(window.end) && overlapsWindow
		})
		.map((entry) => {
			let top = clamp(offsetIn(window, entry.event.startTime), 0, window.height)
			let foot = clamp(offsetIn(window, entry.event.endTime), 0, window.height)
			let height = Math.max(foot - top, MIN_BLOCK_HEIGHT)

			// Ensure the block doesn't overflow the window's foot. If the
			// min-height floor would push it past, pull the block up instead.
			let overflow = top + height - window.height
			if (overflow > 0) {
				top = Math.max(0, top - overflow)
			}

			return {
				key: `${entry.sourceId}|${entry.key}`,
				sourceId: entry.sourceId,
				event: entry.event,
				top,
				height,
			}
		})
		.sort((one, two) => one.top - two.top)

	let columnFeet: number[] = []
	let assigned = positioned.map((block) => {
		let column = columnFeet.findIndex((foot) => foot <= block.top)
		if (column === -1) {
			column = columnFeet.length
		}
		columnFeet[column] = block.top + block.height
		return {...block, column}
	})

	let columnCount = Math.max(columnFeet.length, 1)
	return assigned.map((block) => ({...block, columnCount}))
}
