import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {formatBuildingTimes} from './format-times'
import {parseHours} from './parse-hours'
import {findOpenWindow} from './find-open-window'
import type {HourPairType} from './find-open-window'

// TODO: fetch this over the network
const chapelSchedule: SingleBuildingScheduleType[] = [
	{days: ['Mo', 'We', 'Fr'], from: '10:10am', to: '10:30am'},
	{days: ['Tu'], from: '11:10am', to: '11:30am'},
	{days: ['Th'], from: '11:00am', to: '12:35pm'},
]

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
