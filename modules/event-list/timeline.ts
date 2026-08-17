import type {Moment} from 'moment-timezone'
import type {EventType} from '@frogpond/event-type'

import {isAllDay} from './times'
import type {SourcedEvent} from './types'

/**
 * Measured from Calendar.app: hour labels fall 120px apart on a 3x screen.
 */
export const HOUR_HEIGHT = 40

/**
 * Calendar.app draws four hourly gridlines, the first at the top of the hour
 * holding the event's start -- so an event never shows the hour before it.
 */
export const WINDOW_HOURS = 4

export const WINDOW_HEIGHT = WINDOW_HOURS * HOUR_HEIGHT

/**
 * Below this a block cannot carry its own title, so a fifteen-minute event
 * would draw as an unreadable sliver.
 */
export const MIN_BLOCK_HEIGHT = 20

export interface TimelineWindow {
	start: Moment
	end: Moment
	hours: Moment[]
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
 * The four-hour span an event's timeline covers, or `null` for an all-day
 * event -- which has no position to draw.
 */
export function timelineWindow(event: EventType): TimelineWindow | null {
	if (isAllDay(event)) {
		return null
	}

	let start = event.startTime.clone().startOf('hour')
	let hours = Array.from({length: WINDOW_HOURS}, (_, index) => start.clone().add(index, 'hours'))

	return {start, end: start.clone().add(WINDOW_HOURS, 'hours'), hours}
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
		.filter(
			(entry) =>
				entry.event.startTime.isBefore(window.end) && entry.event.endTime.isAfter(window.start),
		)
		.map((entry) => {
			let top = clamp(offsetIn(window, entry.event.startTime), 0, WINDOW_HEIGHT)
			let foot = clamp(offsetIn(window, entry.event.endTime), 0, WINDOW_HEIGHT)

			return {
				key: `${entry.sourceId}|${entry.key}`,
				sourceId: entry.sourceId,
				event: entry.event,
				top,
				height: Math.max(foot - top, MIN_BLOCK_HEIGHT),
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
