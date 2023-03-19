import type {Moment} from 'moment-timezone'
import type {SingleBuildingScheduleType} from '../types'

import {getDayOfWeek} from './get-day-of-week'
import {isScheduleReallyOpenAtMoment} from './is-schedule-really-open'
import {formatBuildingTimes} from './format-times'
import {parseHours} from './parse-hours'

// TODO: fetch this over the network
const chapelSchedule: SingleBuildingScheduleType[] = [
	{days: ['Mo', 'We', 'Fr'], from: '10:10am', to: '10:30am'},
	{days: ['Tu'], from: '11:10am', to: '11:30am'},
	{days: ['Th'], from: '11:00am', to: '12:35pm'},
]

export function isChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): boolean {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

	if (!sched) {
		return false
	}

	return isScheduleReallyOpenAtMoment(sched, m)
}

export function formatChapelTime(
	m: Moment,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

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
	let sched = schedules.find((sched) => sched.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	let {close} = parseHours(sched, m)

	return m.clone().seconds(0).to(close)
}
