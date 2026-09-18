import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {formatBuildingTimes} from './format-times'
import {parseHours} from './parse-hours'
import {findOpenWindow, windowOpeningOn} from './find-open-window'
import type {HourPairType} from './find-open-window'

// TODO: fetch this over the network
const chapelSchedule: SingleBuildingScheduleType[] = [
	{days: ['Mo', 'We', 'Fr'], from: '10:10am', to: '10:30am'},
	{days: ['Tu'], from: '11:10am', to: '11:30am'},
	{days: ['Th'], from: '11:00am', to: '12:35pm'},
]

/**
 * How long before chapel starts, or after it ends, a countdown is worth showing.
 * Chapel windows run 20 to 95 minutes, so the 30-minute threshold the rest of the
 * status line uses would spend most of one counting down.
 */
export const CHAPEL_COUNTDOWN_MINUTES = 10

/** The chapel window running at `m`, or null when chapel is not in session. */
export function findChapelWindow(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): HourPairType | null {
	for (let schedule of schedules) {
		let window = findOpenWindow(schedule, m)
		if (window) {
			return window
		}
	}

	return null
}

/** Today's chapel window, when it has not started yet at `m`; null otherwise. */
export function findNextChapelWindow(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): HourPairType | null {
	let dayOfWeek = getDayOfWeek(m)

	for (let schedule of schedules) {
		if (!schedule.days.includes(dayOfWeek)) continue

		let window = windowOpeningOn(schedule, m)
		if (m.isBefore(window.open)) {
			return window
		}
	}

	return null
}

export function isChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): boolean {
	return findChapelWindow(m, schedules) !== null
}

export function formatChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((schedule) => schedule.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	return formatBuildingTimes(sched, m)
}

export function getTimeUntilChapelCloses(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((schedule) => schedule.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	let {close} = parseHours(sched, m)

	return m.clone().seconds(0).to(close)
}
