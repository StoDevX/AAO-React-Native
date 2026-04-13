import find from 'lodash/find'
import findLast from 'lodash/findLast'
import findLastIndex from 'lodash/findLastIndex'
import type {Temporal} from 'temporal-polyfill'
import {isBefore, isSameOrAfter, isBetween} from '../../../../lib/temporal'
import type {BusSchedule, DepartureTimeList} from '../types'

const isTruthy = (x: unknown) => Boolean(x)

export type BusStateEnum =
	| 'none'
	| 'before-start'
	| 'after-end'
	| 'running'
	| 'between-rounds'
type ReturnVal = {
	status: BusStateEnum
	times: DepartureTimeList
	index: null | number
	nextStart?: Temporal.ZonedDateTime | null
}

export function getCurrentBusIteration(
	schedule: BusSchedule,
	now: Temporal.ZonedDateTime,
): ReturnVal {
	if (schedule.times.length === 0) {
		return {status: 'none', times: [], index: null, nextStart: null}
	}

	let veryFirst = find(schedule.times[0], isTruthy)
	let veryLast = findLast(schedule.times[schedule.times.length - 1], isTruthy)

	if (!veryFirst || !veryLast) {
		return {status: 'none', times: [], index: null, nextStart: null}
	} else if (isBefore(now, veryFirst)) {
		return {
			status: 'before-start',
			times: [],
			index: null,
			nextStart: veryFirst,
		}
	} else if (isBefore(veryLast, now)) {
		return {status: 'after-end', times: [], index: null, nextStart: null}
	}

	let index = findLastIndex(schedule.times, (stopTimes) => {
		let first = find(stopTimes, isTruthy)
		let last = findLast(stopTimes, isTruthy)

		if (!first || !last) {
			return false
		}

		if (isSameOrAfter(now, first)) {
			return true
		}

		return false
	})

	if (index !== -1) {
		let times = schedule.times[index]
		let nextTimes = schedule.times[index + 1] || []

		let lastStopTime = findLast(times, isTruthy)
		let nextStart = find(nextTimes, isTruthy)

		if (lastStopTime && nextStart && isBetween(now, lastStopTime, nextStart)) {
			return {
				status: 'between-rounds',
				times: nextTimes,
				index: index + 1,
				nextStart,
			}
		}

		return {status: 'running', times, index, nextStart}
	}

	return {status: 'none', times: [], index: null, nextStart: null}
}
