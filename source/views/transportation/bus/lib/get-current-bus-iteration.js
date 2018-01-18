// @flow

import type moment from 'moment'
import find from 'lodash/find'
import findLast from 'lodash/findLast'
import findLastIndex from 'lodash/findLastIndex'
import type {BusSchedule, DepartureTimeList} from '../types'

const isTruthy = x => Boolean(x)

export type BusStateEnum =
	| 'none'
	| 'before-start'
	| 'after-end'
	| 'running'
	| 'between-rounds'
type ReturnVal = {
	status: BusStateEnum,
	times: DepartureTimeList,
	index: null | number,
	nextStart: ?moment,
}

export function getCurrentBusIteration(
	schedule: BusSchedule,
	now: moment,
): ReturnVal {
	// If the schedule is empty
	if (schedule.times.length === 0) {
		return {status: 'none', times: [], index: null, nextStart: null}
	}

	// Handle "now" being before or after the bus runs for the day
	const veryFirst = find(schedule.times[0], isTruthy)
	const veryLast = findLast(schedule.times[schedule.times.length - 1], isTruthy)

	// Start off by handling another empty-schedule case
	if (!veryFirst || !veryLast) {
		return {status: 'none', times: [], index: null, nextStart: null}
	} else if (now.isBefore(veryFirst)) {
		return {
			status: 'before-start',
			times: [],
			index: null,
			nextStart: veryFirst,
		}
	} else if (now.isAfter(veryLast)) {
		return {status: 'after-end', times: [], index: null, nextStart: null}
	}

	// The meat of this function: find the furthest timeset that now is part of.
	// Because we operate on sets, instead of on one giant list of stops, we
	// use isSameOrAfter to account for the gaps between iterations.
	const index = findLastIndex(schedule.times, stopTimes => {
		const first = find(stopTimes, isTruthy)
		const last = findLast(stopTimes, isTruthy)

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
		const times = schedule.times[index]
		const nextTimes = schedule.times[index + 1] || []

		const lastStopTime = findLast(times, isTruthy)
		const nextStart = find(nextTimes, isTruthy)

		// Check if we're between two iterations
		if (lastStopTime && nextStart && now.isBetween(lastStopTime, nextStart)) {
			return {
				status: 'between-rounds',
				times: nextTimes,
				index: index + 1,
				nextStart,
			}
		}

		// If we're not, then return "running"
		return {status: 'running', times, index, nextStart}
	}

	// Last ditch effort: we're not running at all
	return {status: 'none', times: [], index: null, nextStart: null}
}
