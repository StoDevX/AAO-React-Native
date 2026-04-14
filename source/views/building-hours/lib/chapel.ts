import type {Temporal} from 'temporal-polyfill'
import type {SingleBuildingScheduleType} from '../types'
import {relativeTo} from '../../../lib/temporal'

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
	m: Temporal.ZonedDateTime,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): boolean {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((schedule) => schedule.days.includes(dayOfWeek))

	if (!sched) {
		return false
	}

	return isScheduleReallyOpenAtMoment(sched, m)
}

export function formatChapelTime(
	m: Temporal.ZonedDateTime,
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
	m: Temporal.ZonedDateTime,
	schedules: SingleBuildingScheduleType[] = chapelSchedule,
): string {
	let dayOfWeek = getDayOfWeek(m)
	let sched = schedules.find((schedule) => schedule.days.includes(dayOfWeek))

	if (!sched) {
		return 'No chapel'
	}

	let {close} = parseHours(sched, m)
	let mNoSeconds = m.with({
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	})
	return relativeTo(mNoSeconds, close)
}
