import find from 'lodash/find'
import findLast from 'lodash/findLast'
import type {Moment} from 'moment-timezone'

import type {BusSchedule, UnprocessedBusLine} from '../types'
import {getCurrentBusIteration, type BusStateEnum} from './get-current-bus-iteration'
import {getScheduleForNow} from './get-schedule-for-now'
import {processBusLine} from './process-bus-line'

const isTruthy = (x: unknown) => Boolean(x)

function startsIn(now: Moment, start?: Moment | null) {
	if (!start) {
		return 'Error'
	}

	let nowCopy = now.clone()
	return `Starts ${nowCopy.seconds(0).to(start)}`
}

/**
 * A line's state at a moment in time: what it is doing right now (its status
 * and the subtitle that names it, such as "Running" or "Starts in 20
 * minutes"), plus the processed schedule and iteration that state was read
 * from, ready for the widget and timetable to draw from directly.
 */
export function deriveLineState({line, now}: {line: UnprocessedBusLine; now: Moment}): {
	subtitle: string
	status: BusStateEnum
	schedule: BusSchedule
	currentBusIteration: number | null
	parkedStopIndex: number | null
} {
	// The line as a whole, which every row below reads from.
	let processedLine = processBusLine(line, now)

	let scheduleForToday = getScheduleForNow(processedLine.schedules, now)
	let {times, status, index, nextStart, parkedStopIndex} = getCurrentBusIteration(
		scheduleForToday,
		now,
	)

	let isLastBus = index === scheduleForToday.times.length - 1

	let subtitle = 'Error'
	switch (status) {
		case 'none':
			subtitle = 'Not running today'
			break
		case 'before-start':
		case 'between-rounds':
			subtitle = startsIn(now, nextStart)
			break
		case 'after-end':
			subtitle = 'Over for today'
			break
		case 'running': {
			if (isLastBus) {
				subtitle = 'Last Bus'
			} else {
				let first = find(times, isTruthy)
				let last = findLast(times, isTruthy)
				if (!first || !last) {
					subtitle = 'Not running today'
				} else if (now.isBefore(first)) {
					subtitle = startsIn(now, first)
				} else {
					subtitle = 'Running'
				}
			}
			break
		}
		default: {
			// TODO(rye): Find a replacement for this.
			// ;(status: empty)
		}
	}

	return {
		subtitle: subtitle,
		status: status,
		schedule: scheduleForToday,
		currentBusIteration: index,
		parkedStopIndex: parkedStopIndex,
	}
}
