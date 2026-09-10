import type {Moment} from 'moment-timezone'
import type {BusSchedule} from '../types'
import {calculateBusProgress} from './calculate-bus-progress'
import type {BusStateEnum} from './get-current-bus-iteration'

/** Where to draw the bus: the stop it is heading for, and how far along it is. */
export type BusTarget = {targetIndex: number; progress: number; atStop: boolean}

type Iteration = {
	status: BusStateEnum
	index: null | number
	parkedStopIndex: null | number
}

export function findBusTarget(
	schedule: BusSchedule,
	iteration: Iteration,
	now: Moment,
): BusTarget | null {
	let {status, index, parkedStopIndex} = iteration

	// Between rounds the bus is sitting at the end of the loop it just finished.
	// It is somewhere, so the line shows it there.
	if (status === 'between-rounds' && parkedStopIndex !== null) {
		return {targetIndex: parkedStopIndex, progress: 1, atStop: true}
	}

	if (status !== 'running' || index === null) {
		return null
	}

	let times = schedule.times[index]
	if (!times) {
		return null
	}

	let targetIndex: number | null = null
	let previousIndex: number | null = null

	for (let i = 0; i < times.length; i++) {
		let time = times[i]
		if (time === null) {
			continue
		}

		if (now.isSame(time, 'minute')) {
			return {targetIndex: i, progress: 1, atStop: true}
		}

		if (now.isBefore(time, 'minute')) {
			targetIndex = i
			break
		}

		previousIndex = i
	}

	if (targetIndex === null || previousIndex === null) {
		return null
	}

	let previousTime = times[previousIndex]
	let nextTime = times[targetIndex]

	if (!previousTime || !nextTime) {
		return null
	}

	let progress = calculateBusProgress(previousTime, nextTime, now)

	return {targetIndex, progress, atStop: false}
}

/**
 * Hands the bus to the row it is heading for, which draws the whole leg from the
 * stop above down to its own.
 */
export function busPropsForRow(
	busTarget: BusTarget | null,
	index: number,
): {busProgress?: number; busAtStop?: boolean} {
	if (!busTarget || index !== busTarget.targetIndex) {
		return {}
	}

	return busTarget.atStop ? {busAtStop: true} : {busProgress: busTarget.progress}
}
