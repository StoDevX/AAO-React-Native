import type {Moment} from 'moment-timezone'
import type {BusSchedule, DepartureTimeList} from '../types'

const isTruthy = (x: unknown) => Boolean(x)

export type BusStateEnum = 'none' | 'before-start' | 'after-end' | 'running' | 'between-rounds'
type ReturnVal = {
	status: BusStateEnum
	times: DepartureTimeList
	index: null | number
	nextStart?: Moment | null
	/**
	 * Where the bus waits out the gap between rounds: the last stop the round
	 * that just ended actually served. Null whenever the bus is on the move.
	 */
	parkedStopIndex: null | number
}

export function getCurrentBusIteration(schedule: BusSchedule, now: Moment): ReturnVal {
	// If the schedule is empty
	if (schedule.times.length === 0) {
		return {status: 'none', times: [], index: null, nextStart: null, parkedStopIndex: null}
	}

	// Handle "now" being before or after the bus runs for the day
	let veryFirst = schedule.times.at(0)?.find(isTruthy)
	let veryLast = schedule.times.at(-1)?.findLast(isTruthy)

	// Start off by handling another empty-schedule case
	if (!veryFirst || !veryLast) {
		return {status: 'none', times: [], index: null, nextStart: null, parkedStopIndex: null}
	} else if (now.isBefore(veryFirst)) {
		return {
			status: 'before-start',
			times: [],
			index: null,
			nextStart: veryFirst,
			parkedStopIndex: null,
		}
	} else if (now.isAfter(veryLast)) {
		return {status: 'after-end', times: [], index: null, nextStart: null, parkedStopIndex: null}
	}

	// The meat of this function: find the furthest timeset that now is part of.
	// Because we operate on sets, instead of on one giant list of stops, we
	// use isSameOrAfter to account for the gaps between iterations.
	let index = schedule.times.findLastIndex((stopTimes) => {
		let first = stopTimes?.find(isTruthy)
		let last = stopTimes?.findLast(isTruthy)

		// Handle the case where stopTimes is empty
		if (!first || !last) {
			return false
		}

		// The only happy case!
		if (now.isSameOrAfter(first)) {
			return true
		}

		// Otherwise, nope
		return false
	})

	// If we found something, yay!
	if (index !== -1) {
		let times = schedule.times[index]
		let nextTimes = schedule.times[index + 1] || []

		let lastStopTime = times?.findLast(isTruthy)
		let nextStart = nextTimes?.find(isTruthy)

		// Check if we're between two iterations
		if (lastStopTime && nextStart && now.isBetween(lastStopTime, nextStart)) {
			return {
				status: 'between-rounds',
				times: nextTimes,
				index: index + 1,
				nextStart,
				parkedStopIndex: times?.findLastIndex(isTruthy) ?? -1,
			}
		}

		// If we're not, then return "running"
		return {status: 'running', times, index, nextStart, parkedStopIndex: null}
	}

	// Last ditch effort: we're not running at all
	return {status: 'none', times: [], index: null, nextStart: null, parkedStopIndex: null}
}
