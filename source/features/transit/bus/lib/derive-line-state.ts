import find from 'lodash/find'
import findLast from 'lodash/findLast'
import type {Moment} from 'moment-timezone'

import type {BusLine, BusSchedule} from '../types'
import {getCurrentBusIteration, type BusStateEnum} from './get-current-bus-iteration'
import {getScheduleForNow} from './get-schedule-for-now'

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
 * minutes"), plus the schedule and iteration that state was read from, ready
 * for the widget and timetable to draw from directly.
 *
 * Takes the line already parsed, so a caller reading the clock every minute
 * can hold the parse still: `useLineState` is that caller.
 */
export function deriveLineState({line, now}: {line: BusLine; now: Moment}): {
	subtitle: string
	status: BusStateEnum
	schedule: BusSchedule
	currentBusIteration: number | null
	parkedStopIndex: number | null
} {
	let scheduleForToday = getScheduleForNow(line.schedules, now)
	let {times, status, index, nextStart, parkedStopIndex} = getCurrentBusIteration(
		scheduleForToday,
		now,
	)

	let isLastBus = index === scheduleForToday.times.length - 1

	let subtitle: string
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
			// Every `BusStateEnum` is answered above. This arm is here so that
			// adding a sixth stops the compiler rather than slipping through
			// with no subtitle.
			let unhandled: never = status
			subtitle = unhandled
			break
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
