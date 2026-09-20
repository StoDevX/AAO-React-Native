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
 * Where the bus sits relative to one stop's dot, in stops -- negative above it,
 * positive below -- or nothing if it is not on a leg touching that stop. For
 * the timetable's rows, which a `List` clips.
 *
 * Both stops either side of the leg get an answer, and both draw the bus. A
 * `List` row clips anything outside itself, so a bus straddling the seam
 * between two rows would otherwise lose whatever half hangs over. Drawn twice,
 * each row clips its own half and the two halves meet as one bus. Wherever the
 * bus sits well inside one stop's row, the other copy is a whole row away and
 * never appears.
 */
export function busPropsForRow(
	busTarget: BusTarget | null,
	index: number,
): {busFraction?: number; busAtStop?: boolean} {
	if (!busTarget) {
		return {}
	}

	let {targetIndex, progress, atStop} = busTarget

	if (atStop) {
		return index === targetIndex ? {busAtStop: true} : {}
	}

	// The stop it is heading for: the bus is behind that dot, so above it.
	if (index === targetIndex) {
		return {busFraction: progress - 1}
	}

	// The stop it left: the bus is past that dot, so below it.
	if (index === targetIndex - 1) {
		return {busFraction: progress}
	}

	return {}
}

/**
 * The same answer for the widget's strip, which nothing clips.
 *
 * Only the nearer of the two stops either side of the leg draws the bus. Both
 * copies resolve to the same point on the rail, so without a row boundary to
 * cut them in half they would sit one on top of the other -- two beads, each
 * pinging to its own clock. The nearer stop rather than a fixed one of the
 * pair, so the cell drawing the bus is on screen whenever the bus is: the
 * offset never reaches half a cell.
 */
export function busPropsForCell(
	busTarget: BusTarget | null,
	index: number,
): {busFraction?: number; busAtStop?: boolean} {
	if (!busTarget || busTarget.atStop) {
		return busPropsForRow(busTarget, index)
	}

	let {targetIndex, progress} = busTarget
	let nearerIndex = progress < 0.5 ? targetIndex - 1 : targetIndex

	return index === nearerIndex ? busPropsForRow(busTarget, index) : {}
}
